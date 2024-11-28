const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const app = express();

// JWT 密钥
const JWT_SECRET = 'your-secret-key';

// CORS 配置
const corsOptions = {
  origin: 'http://localhost:8080',  // 明确指定前端域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));

app.use(express.json());

// 添加 OPTIONS 预检请求处理
app.options('*', cors(corsOptions));

// 验证 token 的中间件
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // 将解码后的用户信息存储到请求对象中
      next();
    } catch (err) {
      return res.status(401).json({
        code: 401,
        msg: 'token已过期，请重新登录'
      });
    }
  } else {
    res.status(401).json({
      code: 401,
      msg: '未登录或token已过期'
    });
  }
};

// 数据库连接配置
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'mus2024'
});

// 连接数据库
connection.connect((err) => {
  if (err) {
    console.error('数据库连接失败：', err);
    return;
  }
  console.log('数据库连接成功！');
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  
  // 1. 验证role参数
  if (role !== 'root' && role !== 'agent') {
    return res.status(400).json({
      code: 400,
      msg: '无效的角色类型'
    });
  }

  // 2. 根据role选择要查询的表名
  const tableName = role === 'root' ? 'root' : 'agent';
  
  // 3. 先查询用户是否存在
  const checkUserQuery = `SELECT * FROM ${tableName} WHERE username = ?`;
  
  try {
    connection.query(checkUserQuery, [username], (error, results) => {
      if (error) {
        console.error('查询错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      // 4. 判断用户是否存在
      if (results.length === 0) {
        return res.json({
          code: 401,
          msg: '当前用户不存在，请联系管理员'
        });
      }
      
      // 5. 用户存在，验证密码
      const user = results[0];
      if (user.password !== password) {
        return res.json({
          code: 401,
          msg: '密码错误！'
        });
      }
      
      // 6. 验证通过，生成token
      const token = jwt.sign(
        {
          username,
          role,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4) // 4小时后过期
        },
        JWT_SECRET
      );

      // 7. 返回成功响应
      res.json({
        code: 200,
        msg: '登录成功！',
        data: {
          token,
          username,
          role
        }
      });
    });
  } catch (error) {
    console.error('服务器错误：', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误'
    });
  }
});

// 所有卡密相关的接口都需要验证 token
app.use('/api/cards', verifyToken);

// 获取卡密列表
app.post('/api/cards/list', verifyToken, (req, res) => {
  const { username, role } = req.user;
  const { pageNum = 1, pageSize = 5 } = req.body;
  
  // 计算偏移量
  const offset = (pageNum - 1) * pageSize;
  
  // 根据角色构建不同的查询
  const countQuery = role === 'root' 
    ? 'SELECT COUNT(*) as total FROM agent_cami'
    : 'SELECT COUNT(*) as total FROM agent_cami WHERE agent_name = ?';
    
  const dataQuery = role === 'root' 
    ? `SELECT * FROM agent_cami ORDER BY creation_time DESC LIMIT ?, ?`
    : `SELECT * FROM agent_cami WHERE agent_name = ? ORDER BY creation_time DESC LIMIT ?, ?`;
  
  const countParams = role === 'root' ? [] : [username];
  const dataParams = role === 'root' ? [offset, pageSize] : [username, offset, pageSize];

  // 先查询总数
  connection.query(countQuery, countParams, (error, countResults) => {
    if (error) {
      console.error('获取卡密总数错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    const total = countResults[0].total;
    
    // 再查询分页数据
    connection.query(dataQuery, dataParams, (error, results) => {
      if (error) {
        console.error('获取卡密列表错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          list: results,
          total,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

// 创建单个卡密
app.post('/api/cards/create', verifyToken, async (req, res) => {
  const { cami, status, creation_time, expiration_time } = req.body;
  const { username, role } = req.user;

  // 获取用户当前积分
  const tableName = role === 'root' ? 'root' : 'agent';
  const userQuery = `SELECT points_balance FROM ${tableName} WHERE username = ?`;
  
  try {
    // 使用 Promise 包装查询操作
    const getUserPoints = () => {
      return new Promise((resolve, reject) => {
        connection.query(userQuery, [username], (error, results) => {
          if (error) reject(error);
          else resolve(results[0]);
        });
      });
    };

    const userInfo = await getUserPoints();
    const currentPoints = userInfo.points_balance;
    const requiredPoints = 1; // 单个卡密需要1积分

    // 检查积分是否足够
    if (currentPoints < requiredPoints) {
      return res.status(400).json({
        code: 400,
        msg: '当前积分余额不足，请充值！'
      });
    }

    // 扣除积分
    const updatePointsQuery = `UPDATE ${tableName} SET points_balance = points_balance - ? WHERE username = ?`;
    const updatePoints = () => {
      return new Promise((resolve, reject) => {
        connection.query(updatePointsQuery, [requiredPoints, username], (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
    };

    await updatePoints();

    // 创建卡密
    const query = `INSERT INTO agent_cami (cami, status, creation_time, expiration_time, agent_name) 
                   VALUES (?, ?, ?, ?, ?)`;
    
    connection.query(
      query, 
      [cami, status, creation_time, expiration_time, username], 
      (error, results) => {
        if (error) {
          console.error('创建卡密错误：', error);
          // 如果创建卡密失败，需要退还积分
          connection.query(updatePointsQuery, [-requiredPoints, username]);
          return res.status(500).json({
            code: 500,
            msg: '服务器错误'
          });
        }
        
        res.json({
          code: 200,
          msg: '创建成功',
          data: {
            card: { ...req.body, agent_name: username },
            deductedPoints: requiredPoints,
            remainingPoints: currentPoints - requiredPoints
          }
        });
      }
    );
  } catch (error) {
    console.error('处理请求错误：', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误'
    });
  }
});

// 批量创建卡密
app.post('/api/cards/batch-create', verifyToken, async (req, res) => {
  const { cards } = req.body;
  const { username, role } = req.user;
  
  // 获取用户当前积分
  const tableName = role === 'root' ? 'root' : 'agent';
  const userQuery = `SELECT points_balance FROM ${tableName} WHERE username = ?`;
  
  try {
    // 使用 Promise 包装查询操作
    const getUserPoints = () => {
      return new Promise((resolve, reject) => {
        connection.query(userQuery, [username], (error, results) => {
          if (error) reject(error);
          else resolve(results[0]);
        });
      });
    };

    const userInfo = await getUserPoints();
    const currentPoints = userInfo.points_balance;
    const requiredPoints = cards.length; // 需要的积分数等于要生成的卡密数量

    // 检查积分是否足够
    if (currentPoints < requiredPoints) {
      return res.status(400).json({
        code: 400,
        msg: '当前积分余额不足，请充值！'
      });
    }

    // 扣除积分
    const updatePointsQuery = `UPDATE ${tableName} SET points_balance = points_balance - ? WHERE username = ?`;
    const updatePoints = () => {
      return new Promise((resolve, reject) => {
        connection.query(updatePointsQuery, [requiredPoints, username], (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
    };

    await updatePoints();

    // 生成卡密
    const values = cards.map(card => [
      card.cami,
      card.status,
      card.creation_time,
      card.expiration_time,
      username
    ]);
    
    const insertQuery = `INSERT INTO agent_cami (cami, status, creation_time, expiration_time, agent_name) 
                        VALUES ?`;
    
    connection.query(insertQuery, [values], (error, results) => {
      if (error) {
        console.error('批量创建卡密错误：', error);
        // 如果创建卡密失败，需要退还积分
        connection.query(updatePointsQuery, [-requiredPoints, username]);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '批量创建成功',
        data: {
          cards: cards.map(card => ({ ...card, agent_name: username })),
          deductedPoints: requiredPoints,
          remainingPoints: currentPoints - requiredPoints
        }
      });
    });
  } catch (error) {
    console.error('处理请求错误：', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误'
    });
  }
});

// 删除单个卡密
app.post('/api/cards/delete', verifyToken, (req, res) => {
  const { id } = req.body;
  const { username, role } = req.user;

  // 构建查询条件：root可以删除所有，agent只能删除自己的
  const condition = role === 'root' ? 'id = ?' : 'id = ? AND agent_name = ?';
  const params = role === 'root' ? [id] : [id, username];

  const query = `DELETE FROM agent_cami WHERE ${condition}`;
  
  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('删除卡密错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    if (results.affectedRows === 0) {
      return res.json({
        code: 403,
        msg: '无权删除该卡密或卡密不存在'
      });
    }
    
    res.json({
      code: 200,
      msg: '删除成功'
    });
  });
});

// 批量删除卡密
app.post('/api/cards/batch-delete', verifyToken, (req, res) => {
  const { ids } = req.body;
  const { username, role } = req.user;

  // 构建查询条件：root可以删除所有，agent能删除自己的
  const condition = role === 'root' ? 'id IN (?)' : 'id IN (?) AND agent_name = ?';
  const params = role === 'root' ? [ids] : [ids, username];

  const query = `DELETE FROM agent_cami WHERE ${condition}`;
  
  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('批量删除卡密错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    res.json({
      code: 200,
      msg: '批量删除成功',
      data: { affected: results.affectedRows }
    });
  });
});

// 获取用户信息接口
app.get('/api/user/info', verifyToken, (req, res) => {
  const { username, role } = req.user;
  const tableName = role === 'root' ? 'root' : 'agent';
  
  const query = `SELECT id, username, name, role, points_balance, wechat, password 
                 FROM ${tableName} 
                 WHERE username = ?`;
  
  connection.query(query, [username], (error, results) => {
    if (error) {
      console.error('获取用户信息错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在'
      });
    }
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: results[0]
    });
  });
});

// 更新用户信息接口
app.post('/api/user/update', verifyToken, (req, res) => {
  const { username, role } = req.user;
  const { name, wechat, password } = req.body;
  const tableName = role === 'root' ? 'root' : 'agent';
  
  // 构建更新字段
  let updateFields = [];
  let queryParams = [];
  
  // 检查并添加每个字段（包括空字符串）
  if (name !== undefined) {
    updateFields.push('name = ?');
    queryParams.push(name);
  }
  
  if (wechat !== undefined) {
    updateFields.push('wechat = ?');
    queryParams.push(wechat);
  }
  
  // 特别处理密码字段
  if (password !== undefined && password !== '') {
    console.log('更新密码:', password); // 添加日志
    updateFields.push('password = ?');
    queryParams.push(password);
  }
  
  // 如果没有要更新的字段，直接返回成功
  if (updateFields.length === 0) {
    return res.json({
      code: 200,
      msg: '没有需要更新的字段'
    });
  }
  
  // 添加 WHERE 条件的参数
  queryParams.push(username);
  
  // 构建 SQL 查询
  const query = `UPDATE ${tableName} 
                 SET ${updateFields.join(', ')} 
                 WHERE username = ?`;
  
  // 打印 SQL 查询和参数，用于调试
  console.log('SQL Query:', query);
  console.log('Query Params:', queryParams);
  
  connection.query(query, queryParams, (error, results) => {
    if (error) {
      console.error('更新用户信息错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在'
      });
    }
    
    // 打印更新结果
    console.log('Update Results:', results);
    
    res.json({
      code: 200,
      msg: '更新成功'
    });
  });
});

// 获取用户列表
app.get('/api/users/list', verifyToken, (req, res) => {
  const { role } = req.user;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }

  // 查询root用户
  const rootQuery = 'SELECT id, username, name, role, points_balance, wechat FROM root';
  // 查询agent用户
  const agentQuery = 'SELECT id, username, name, role, points_balance, wechat FROM agent';
  
  connection.query(rootQuery, (error, rootResults) => {
    if (error) {
      console.error('查询root用户错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    connection.query(agentQuery, (error, agentResults) => {
      if (error) {
        console.error('查询agent用户错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          rootUsers: rootResults,
          agentUsers: agentResults
        }
      });
    });
  });
});

// 创建用户
app.post('/api/users/create', verifyToken, (req, res) => {
  const { role } = req.user;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权操作'
    });
  }

  const { username, password, name, wechat, points_balance, role: userRole } = req.body;
  const tableName = userRole === 'root' ? 'root' : 'agent';
  
  const query = `INSERT INTO ${tableName} (username, password, name, wechat, points_balance, role) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
                 
  connection.query(
    query,
    [username, password, name, wechat, points_balance, userRole],
    (error, results) => {
      if (error) {
        console.error('创建用户错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '创建成功'
      });
    }
  );
});

// 更新用户
app.post('/api/users/update', verifyToken, (req, res) => {
  const { role } = req.user;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权操作'
    });
  }

  const { username, name, wechat, points_balance, role: userRole } = req.body;
  const tableName = userRole === 'root' ? 'root' : 'agent';
  
  const query = `UPDATE ${tableName} 
                 SET name = ?, wechat = ?, points_balance = ? 
                 WHERE username = ?`;
                 
  connection.query(
    query,
    [name, wechat, points_balance, username],
    (error, results) => {
      if (error) {
        console.error('更新用户错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '更新成功'
      });
    }
  );
});

// 删除用户
app.post('/api/users/delete', verifyToken, (req, res) => {
  const { role } = req.user;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权操作'
    });
  }

  const { username, type } = req.body;
  const tableName = type === 'root' ? 'root' : 'agent';
  
  const query = `DELETE FROM ${tableName} WHERE username = ?`;
  
  connection.query(query, [username], (error, results) => {
    if (error) {
      console.error('删除用户错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    res.json({
      code: 200,
      msg: '删除成功'
    });
  });
});

// 更新卡密状态
app.post('/api/cards/update-status', verifyToken, (req, res) => {
  const { id, status } = req.body;
  const { username, role } = req.user;

  // 构建查询条件：root可以更新所有，agent只能更���自己的
  const condition = role === 'root' ? 'id = ?' : 'id = ? AND agent_name = ?';
  const params = role === 'root' ? [status, id] : [status, id, username];

  const query = `UPDATE agent_cami SET status = ? WHERE ${condition}`;
  
  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('更新卡密状态错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    if (results.affectedRows === 0) {
      return res.json({
        code: 403,
        msg: '无权更新该卡密或卡密不存在'
      });
    }
    
    res.json({
      code: 200,
      msg: '更新成功'
    });
  });
});

// 创建充值订单
app.post('/api/orders/create', verifyToken, (req, res) => {
  const { points, amount } = req.body;
  const { username, role } = req.user;
  const tableName = role === 'root' ? 'root' : 'agent';
  
  // 生成订单号
  const orderNo = 'CZ' + Date.now() + Math.random().toString(36).substr(2, 6);
  
  const query = `INSERT INTO orders (order_no, username, role, points, amount, status, create_time) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`;
                 
  connection.query(
    query,
    [orderNo, username, role, points, amount, 'pending'],
    (error, results) => {
      if (error) {
        console.error('创建订单错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '创建订单成功',
        data: {
          orderNo,
          points,
          amount
        }
      });
    }
  );
});

// 更新订单状态
app.post('/api/orders/update-status', verifyToken, async (req, res) => {
  const { role } = req.user;
  const { orderNo, status } = req.body;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权操作'
    });
  }

  try {
    // 先获取订单信息
    const getOrderQuery = 'SELECT * FROM orders WHERE order_no = ?';
    const order = await new Promise((resolve, reject) => {
      connection.query(getOrderQuery, [orderNo], (error, results) => {
        if (error) reject(error);
        else resolve(results[0]);
      });
    });

    if (!order) {
      return res.status(404).json({
        code: 404,
        msg: '订单不存在'
      });
    }

    // 更新订单状态
    // 如果是确认支付,则同时更新支付时间
    const updateQuery = status === 'paid' 
      ? 'UPDATE orders SET status = ?, pay_time = NOW() WHERE order_no = ?'
      : 'UPDATE orders SET status = ? WHERE order_no = ?';
      
    await new Promise((resolve, reject) => {
      connection.query(updateQuery, [status, orderNo], (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    // 如果订单状态更新为已支付，增加用户积分
    if (status === 'paid') {
      const updatePointsQuery = `
        UPDATE ${order.role === 'root' ? 'root' : 'agent'}
        SET points_balance = points_balance + ?
        WHERE username = ?
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(updatePointsQuery, [order.points, order.username], (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
    }

    res.json({
      code: 200,
      msg: '更新成功'
    });
  } catch (error) {
    console.error('更新订单状态错误：', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误'
    });
  }
});

// 获取订单列表
app.post('/api/orders/list', verifyToken, (req, res) => {
  const { role } = req.user;
  const { pageNum = 1, pageSize = 10 } = req.body;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }

  const offset = (pageNum - 1) * pageSize;
  
  // 获取总数
  const countQuery = 'SELECT COUNT(*) as total FROM orders';
  
  connection.query(countQuery, (error, countResults) => {
    if (error) {
      console.error('获取订单总数错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    const total = countResults[0].total;
    
    // 获取分页数据
    const dataQuery = `
      SELECT * FROM orders 
      ORDER BY create_time DESC 
      LIMIT ?, ?
    `;
    
    connection.query(dataQuery, [offset, pageSize], (error, results) => {
      if (error) {
        console.error('获取订单列表错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          list: results,
          total,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

// 获取我的订单列表
app.post('/api/orders/my-list', verifyToken, (req, res) => {
  const { username, role } = req.user;
  const { pageNum = 1, pageSize = 10 } = req.body;
  
  const offset = (pageNum - 1) * pageSize;
  
  // 获取总数
  const countQuery = 'SELECT COUNT(*) as total FROM orders WHERE username = ? AND role = ?';
  
  connection.query(countQuery, [username, role], (error, countResults) => {
    if (error) {
      console.error('获取订单总数错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    const total = countResults[0].total;
    
    // 获取分页数据
    const dataQuery = `
      SELECT * FROM orders 
      WHERE username = ? AND role = ?
      ORDER BY create_time DESC 
      LIMIT ?, ?
    `;
    
    connection.query(dataQuery, [username, role, offset, pageSize], (error, results) => {
      if (error) {
        console.error('获取订单列表错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          list: results,
          total,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

// 获取公告列表
app.post('/api/notices/list', verifyToken, (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.body;
  const offset = (pageNum - 1) * pageSize;
  
  // 获取总数
  const countQuery = 'SELECT COUNT(*) as total FROM notices';
  
  connection.query(countQuery, (error, countResults) => {
    if (error) {
      console.error('获取公告总数错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    const total = countResults[0].total;
    
    // 获取分页数据
    const dataQuery = `
      SELECT * FROM notices 
      ORDER BY create_time DESC 
      LIMIT ?, ?
    `;
    
    connection.query(dataQuery, [offset, pageSize], (error, results) => {
      if (error) {
        console.error('获取公告列表错误：', error);
        return res.status(500).json({
          code: 500,
          msg: '服务器错误'
        });
      }
      
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          list: results,
          total,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

// 添加新的权限校验接口
app.post('/api/notices/check-permission', verifyToken, (req, res) => {
  const { role } = req.user;
  
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }
  
  res.json({
    code: 200,
    msg: '验证通过',
    data: {
      hasPermission: true
    }
  });
});

// 创建公告
app.post('/api/notices/create', verifyToken, (req, res) => {
  const { role } = req.user;
  const { title, content } = req.body;
  
  // 添加权限验证
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }

  const query = `INSERT INTO notices (title, content, create_time) 
                 VALUES (?, ?, NOW())`;
                 
  connection.query(query, [title, content], (error, results) => {
    if (error) {
      console.error('创建公告错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    res.json({
      code: 200,
      msg: '创建成功'
    });
  });
});

// 更新公告
app.post('/api/notices/update', verifyToken, (req, res) => {
  const { role } = req.user;
  const { id, title, content } = req.body;
  
  // 添加权限验证
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }

  const query = `UPDATE notices SET title = ?, content = ? WHERE id = ?`;
                 
  connection.query(query, [title, content, id], (error, results) => {
    if (error) {
      console.error('更新公告错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    res.json({
      code: 200,
      msg: '更新成功'
    });
  });
});

// 删除公告
app.post('/api/notices/delete', verifyToken, (req, res) => {
  const { role } = req.user;
  const { id } = req.body;
  
  // 添加权限验证
  if (role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }

  const query = `DELETE FROM notices WHERE id = ?`;
                 
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('删除公告错误：', error);
      return res.status(500).json({
        code: 500,
        msg: '服务器错误'
      });
    }
    
    res.json({
      code: 200,
      msg: '删除成功'
    });
  });
});

// 添加新的菜单权限校验接口
app.post('/api/menu/check-permission', verifyToken, (req, res) => {
  const { role } = req.user;
  const { menuPath } = req.body;  // 接收要访问的菜单路径
  
  // 需要root权限的菜单路径
  const rootMenus = ['/home/users', '/home/orders', '/home/notices'];
  
  if (rootMenus.includes(menuPath) && role !== 'root') {
    return res.status(403).json({
      code: 403,
      msg: '无权访问'
    });
  }
  
  res.json({
    code: 200,
    msg: '验证通过',
    data: {
      hasPermission: true
    }
  });
});

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误：', err);
  res.status(500).json({
    code: 500,
    msg: '服务器错误'
  });
});

// 所有路由都添加 CORS 头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 启动服务器
const PORT = 7070;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 

