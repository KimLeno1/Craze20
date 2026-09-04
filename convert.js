const fs = require('fs');
let schema = fs.readFileSync('schema.sql', 'utf8');

schema = schema.replace(/TEXT PRIMARY KEY/g, 'VARCHAR(255) PRIMARY KEY');
schema = schema.replace(/INTEGER/g, 'INT');
schema = schema.replace(/REAL/g, 'DOUBLE');
schema = schema.replace(/email TEXT NOT NULL UNIQUE/g, 'email VARCHAR(255) NOT NULL UNIQUE');
schema = schema.replace(/code TEXT NOT NULL UNIQUE/g, 'code VARCHAR(255) NOT NULL UNIQUE');
schema = schema.replace(/token TEXT NOT NULL UNIQUE/g, 'token VARCHAR(255) NOT NULL UNIQUE');
schema = schema.replace(/userId TEXT,/g, 'userId VARCHAR(255),');
schema = schema.replace(/productId TEXT,/g, 'productId VARCHAR(255),');
schema = schema.replace(/supplierId TEXT,/g, 'supplierId VARCHAR(255),');
schema = schema.replace(/postId TEXT,/g, 'postId VARCHAR(255),');
schema = schema.replace(/PRIMARY KEY \(userId, postId\)/g, 'PRIMARY KEY (userId, postId)');
schema = schema.replace(/key TEXT PRIMARY KEY/g, '`key` VARCHAR(255) PRIMARY KEY');

fs.writeFileSync('schema.sql', schema);
