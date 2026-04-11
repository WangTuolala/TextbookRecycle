# 二手教材回收与共享管理系统

> A Spring Boot-based textbook recycling and sharing management system for universities.

## 📖 项目介绍

**二手教材回收与共享管理系统** 是一个面向大学校园的教材循环利用平台。系统连接学生、管理员和后勤三方，实现教材回收、评估、积分兑换的全流程数字化管理，帮助减少教材浪费，促进资源循环利用。

### 核心功能

| 模块 | 功能描述 |
|------|----------|
| **用户管理** | 学生、管理员、后勤三种角色注册登录 |
| **教材回收** | 学生提交教材回收预约，管理员审核 |
| **教材评估** | 管理员对回收教材进行评估定级 |
| **积分系统** | 教材回收获得积分，积分可兑换奖品 |
| **奖品兑换** | 学生用积分兑换奖品，后勤确认领取 |
| **库存管理** | 后勤管理教材入库、出库、盘点 |
| **公告通知** | 系统公告、领取须知通知 |
| **数据统计** | 管理员查看回收统计图表 |

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| **后端框架** | Spring Boot 3.2.5 |
| **数据库** | MySQL 8.0 |
| **ORM** | Spring Data JPA |
| **构建工具** | Maven |
| **Java 版本** | JDK 17 |
| **前端** | 原生 HTML/CSS/JavaScript |
| **模板引擎** | Thymeleaf（静态资源服务） |

### 主要依赖

```
- spring-boot-starter-web      # Web 接口
- spring-boot-starter-data-jpa  # 数据库访问
- spring-boot-starter-validation # 参数校验
- mysql-connector-j            # MySQL 驱动
- lombok                        # 简化代码
- spring-boot-devtools          # 热更新
```

---

## 🗂️ 项目结构

```
LL/
├── pom.xml                              # Maven 配置
├── src/main/java/com/gluniversity/textbookrecyclesys/
│   ├── TextbookRecycleSysApplication.java   # 应用入口
│   ├── config/
│   │   ├── DataInitializer.java         # 数据初始化（测试账号）
│   │   └── WebConfig.java               # Web 配置
│   ├── controller/                      # 控制器层
│   │   ├── AdminController.java         # 管理员接口
│   │   ├── AuthController.java          # 登录注册接口
│   │   ├── LogisticsController.java      # 后勤接口
│   │   └── StudentController.java       # 学生接口
│   ├── service/                         # 业务逻辑层
│   │   ├── AnnouncementService.java
│   │   ├── BookService.java
│   │   ├── CategoryService.java
│   │   ├── InventoryService.java
│   │   ├── PrizeService.java
│   │   ├── RecycleService.java
│   │   └── UserService.java
│   ├── repository/                      # 数据访问层
│   │   ├── AnnouncementRepository.java
│   │   ├── BookRepository.java
│   │   ├── CategoryRepository.java
│   │   ├── EvaluationRepository.java
│   │   ├── InventoryRecordRepository.java
│   │   ├── LocationNoticeRepository.java
│   │   ├── NoticeRepository.java
│   │   ├── PointsRecordRepository.java
│   │   ├── PointsRuleRepository.java
│   │   ├── PrizeExchangeRepository.java
│   │   ├── PrizeRepository.java
│   │   ├── RecycleAppointmentRepository.java
│   │   └── UserRepository.java
│   ├── entity/                          # 实体类
│   │   ├── Announcement.java
│   │   ├── Book.java
│   │   ├── Category.java
│   │   ├── Evaluation.java
│   │   ├── InventoryRecord.java
│   │   ├── LocationNotice.java
│   │   ├── Notice.java
│   │   ├── PointsRecord.java
│   │   ├── PointsRule.java
│   │   ├── Prize.java
│   │   ├── PrizeExchange.java
│   │   ├── RecycleAppointment.java
│   │   └── User.java
│   └── dto/                             # 数据传输对象
│       ├── ApiResponse.java
│       ├── AppointmentRequest.java
│       ├── BookRequest.java
│       ├── LoginRequest.java
│       ├── PointsRuleRequest.java
│       ├── PrizeRequest.java
│       └── RegisterRequest.java
├── src/main/resources/
│   ├── application.properties           # 应用配置
│   └── static/                          # 静态资源
│       ├── index.html                   # 登录页
│       ├── admin/                       # 管理员端页面
│       ├── student/                     # 学生端页面
│       ├── logistics/                   # 后勤端页面
│       ├── css/                         # 样式文件
│       └── js/                          # 前端脚本
│           ├── common.js                # 通用工具函数
│           ├── auth.js                  # 认证相关
│           ├── admin.js                 # 管理员脚本
│           ├── student.js               # 学生脚本
│           └── logistics.js             # 后勤脚本
└── data/                               # 数据库文件（H2 模式）
```

---

## 🔧 环境准备

### 1. 安装 JDK 17

推荐使用 **JDK 17 LTS** 版本。

**Windows:**
- 下载地址：https://adoptium.net/temurin/releases/?version=17
- 安装后设置环境变量 `JAVA_HOME` 指向 JDK 目录
- 验证：`java -version`

**macOS/Linux:**
```bash
# macOS (Homebrew)
brew install openjdk@17

# Ubuntu/Debian
sudo apt install openjdk-17-jdk
```

### 2. 安装 MySQL 8.0

**Windows:**
- 下载地址：https://dev.mysql.com/downloads/mysql/
- 选择 Windows (x86, 64-bit), MSI Installer
- 安装时选择 "Legacy Authentication" 或 "Strong Password Authentication"
- 记住 root 用户密码

**验证安装：**
```bash
mysql -u root -p
```

### 3. 安装 Maven

**Windows:**
- 下载地址：https://maven.apache.org/download.cgi
- 解压到 `C:\apache-maven`
- 将 `C:\apache-maven\bin` 添加到 PATH
- 验证：`mvn -version`

**macOS:**
```bash
brew install maven
```

### 4. 安装 IntelliJ IDEA（推荐）

- 下载地址：https://www.jetbrains.com/idea/download/
- 推荐安装 **IntelliJ IDEA Ultimate**（有 Spring Boot 插件支持）
- 也可使用 VS Code + Spring Boot Extension Pack

---

## 🚀 项目配置与运行

### 1. 创建数据库

启动 MySQL 后，执行以下命令创建数据库：

```sql
CREATE DATABASE textbook_recycle
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;
USE textbook_recycle;
SHOW TABLES;
```

### 2. 修改数据库配置

编辑 `src/main/resources/application.properties`：

```properties
# 数据库连接
spring.datasource.url=jdbc:mysql://localhost:3306/textbook_recycle?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD_HERE

# JPA 配置
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# 服务器配置
server.port=8080
```

> ⚠️ 将 `YOUR_PASSWORD_HERE` 替换为你的 MySQL root 密码。

### 3. 在 IntelliJ IDEA 中运行

1. **打开项目**：File → Open → 选择 `C:\Users\Administrator\IdeaProjects\LL`
2. **等待 Maven 索引**：右下角进度条完成
3. **运行应用**：
   - 找到 `TextbookRecycleSysApplication.java`
   - 右键 → Run 'TextbookRecycleSysApplication'
   - 或点击编辑器顶部的绿色运行按钮
4. **访问系统**：浏览器打开 http://localhost:8080

### 4. 使用 Maven 命令行运行

```bash
cd C:\Users\Administrator\IdeaProjects\LL

# 编译项目
mvn compile

# 运行项目
mvn spring-boot:run

# 或先打包再运行
mvn clean package -DskipTests
java -jar target/textbook-recycle-system-0.0.1-SNAPSHOT.jar
```

---

## 👤 测试账号

系统初始化时会自动创建以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 学生 | 202431100122 | 123456 | 参与教材回收和兑换 |
| 管理员 | admin | 123456 | 审核预约、管理教材、查看统计 |
| 后勤 | logistics | 123456 | 管理库存、发放奖品、发布通知 |

> 💡 管理员和后勤账号的姓名可自定义，修改后会保存在浏览器 Session 中。

---

## 📱 系统功能截图

### 登录页面
- 支持学生/管理员/后勤三种角色登录
- 新用户注册功能

### 学生端
- **首页集市**：浏览可兑换教材
- **教材回收**：提交回收预约，查看积分
- **积分兑换**：用积分兑换奖品
- **个人信息**：修改个人资料
- **公告通知**：查看系统公告和领取须知

### 管理端
- **回收审核**：审核学生提交的教材回收预约
- **评估管理**：对回收教材进行评估定级
- **书籍管理**：管理教材库存信息
- **分类管理**：管理教材分类
- **奖品管理**：添加/编辑可兑换奖品
- **规则设置**：设置各评估等级的积分规则
- **库存管理**：入库/出库/盘点
- **数据统计**：图表展示回收数据

### 后勤端
- **领取管理**：确认学生领取奖品
- **奖品管理**：库存管理和奖品信息维护
- **公告通知**：发布/删除领取须知
- **个人信息**：修改个人资料

---

## 🔌 API 接口一览

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 学生接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/student/profile` | 获取个人信息 |
| PUT | `/api/student/profile` | 更新个人信息 |
| GET | `/api/student/points` | 获取积分信息 |
| GET | `/api/student/appointments` | 获取预约记录 |
| POST | `/api/student/appointments` | 提交回收预约 |
| GET | `/api/student/exchanges` | 获取兑换记录 |
| POST | `/api/student/exchanges` | 兑换奖品 |
| GET | `/api/student/books` | 获取可兑换教材 |
| GET | `/api/student/notices` | 获取通知列表 |
| GET | `/api/student/announcements` | 获取公告列表 |
| GET | `/api/student/location-notice` | 获取领取须知 |

### 管理员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/appointments` | 获取预约列表 |
| POST | `/api/admin/appointments/{id}/approve` | 审核通过预约 |
| POST | `/api/admin/appointments/{id}/reject` | 拒绝预约 |
| GET | `/api/admin/evaluations` | 获取评估列表 |
| POST | `/api/admin/evaluations/{id}/approve` | 审核通过评估 |
| GET | `/api/admin/books` | 获取教材列表 |
| POST | `/api/admin/books` | 添加教材 |
| PUT | `/api/admin/books/{id}` | 更新教材 |
| DELETE | `/api/admin/books/{id}` | 删除教材 |
| GET | `/api/admin/categories` | 获取分类列表 |
| POST | `/api/admin/categories` | 添加分类 |
| PUT | `/api/admin/categories/{id}` | 更新分类 |
| DELETE | `/api/admin/categories/{id}` | 删除分类 |
| GET | `/api/admin/points-rule` | 获取积分规则 |
| PUT | `/api/admin/points-rule` | 更新积分规则 |
| GET | `/api/admin/stats/charts` | 获取图表统计数据 |
| GET | `/api/admin/stats/overview` | 获取概览统计 |
| GET | `/api/admin/inventory` | 获取库存记录 |
| POST | `/api/admin/inventory/in` | 入库 |
| POST | `/api/admin/inventory/out` | 出库 |

### 后勤接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/logistics/exchanges/pending` | 获取待领取列表 |
| POST | `/api/logistics/exchanges/{id}/pickup` | 确认领取 |
| GET | `/api/logistics/prizes` | 获取奖品列表 |
| POST | `/api/logistics/prizes` | 添加奖品 |
| PUT | `/api/logistics/prizes/{id}` | 更新奖品 |
| DELETE | `/api/logistics/prizes/{id}` | 删除奖品 |
| GET | `/api/logistics/announcements` | 获取公告列表 |
| POST | `/api/logistics/announcements` | 发布公告 |
| GET | `/api/logistics/location-notices` | 获取领取通知列表 |
| POST | `/api/logistics/location-notices` | 发布领取通知 |
| DELETE | `/api/logistics/location-notices/{id}` | 删除领取通知 |

---

## 📊 数据库表结构

### 创建数据库和建表 SQL

复制以下 SQL 到 MySQL 执行，即可完成数据库和所有表的创建：

```sql
-- ============================================
-- 二手教材回收与共享管理系统 - 数据库初始化脚本
-- 数据库: textbook_recycle
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS textbook_recycle
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE textbook_recycle;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'STUDENT, ADMIN, LOGISTICS',
    name VARCHAR(100),
    phone VARCHAR(20),
    college VARCHAR(100),
    major VARCHAR(100),
    class_name VARCHAR(50),
    entry_year VARCHAR(20),
    emp_id VARCHAR(50),
    dept VARCHAR(100),
    position VARCHAR(50),
    workplace VARCHAR(200),
    points INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 分类表 (categories)
-- ============================================
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    code VARCHAR(50),
    sort INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表（专业分类）';

-- ============================================
-- 3. 教材表 (books)
-- ============================================
DROP TABLE IF EXISTS books;
CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL COMMENT '书名',
    author VARCHAR(100),
    publisher VARCHAR(100),
    isbn VARCHAR(50),
    major VARCHAR(100) NOT NULL COMMENT '所属专业',
    `condition` VARCHAR(20) COMMENT '全新, 良好, 一般, 陈旧',
    points INT DEFAULT 0,
    stock INT DEFAULT 0,
    cover_image LONGTEXT COMMENT '封面图片(base64)',
    status VARCHAR(20) DEFAULT 'LISTED' COMMENT 'LISTED, DELISTED',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_major (major),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教材表';

-- ============================================
-- 4. 回收预约表 (recycle_appointments)
-- ============================================
DROP TABLE IF EXISTS recycle_appointments;
CREATE TABLE recycle_appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50) COMMENT '预约编号 AP-YYYYMMDD-XXX',
    student_id BIGINT NOT NULL,
    student_name VARCHAR(100),
    student_username VARCHAR(50),
    book_name VARCHAR(200) NOT NULL,
    isbn VARCHAR(50),
    publisher VARCHAR(100),
    `condition` VARCHAR(20) COMMENT '学生自评',
    quantity INT DEFAULT 1,
    remark VARCHAR(500),
    cover_image LONGTEXT,
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED, COMPLETED',
    submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收预约表';

-- ============================================
-- 5. 评估表 (evaluations)
-- ============================================
DROP TABLE IF EXISTS evaluations;
CREATE TABLE evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50),
    student_id BIGINT NOT NULL,
    student_name VARCHAR(100),
    student_username VARCHAR(50),
    book_name VARCHAR(200),
    author VARCHAR(100),
    publisher VARCHAR(100),
    isbn VARCHAR(50),
    self_condition VARCHAR(20) COMMENT '学生自评',
    admin_condition VARCHAR(20) COMMENT '管理员评定',
    points INT,
    cover_image TEXT,
    remark VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, LISTED, DELISTED',
    submit_time DATETIME,
    evaluate_time DATETIME,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评估表';

-- ============================================
-- 6. 积分规则表 (points_rules)
-- ============================================
DROP TABLE IF EXISTS points_rules;
CREATE TABLE points_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_new INT DEFAULT 200 COMMENT '全新书积分',
    rule_good INT DEFAULT 150 COMMENT '良好书积分',
    rule_normal INT DEFAULT 80 COMMENT '一般书积分',
    rule_old INT DEFAULT 40 COMMENT '陈旧书积分',
    prize_max INT DEFAULT 500 COMMENT '单次兑换上限'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则表';

-- ============================================
-- 7. 积分记录表 (points_records)
-- ============================================
DROP TABLE IF EXISTS points_records;
CREATE TABLE points_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100),
    type VARCHAR(20) NOT NULL COMMENT 'RECYCLE, EXCHANGE',
    points INT NOT NULL COMMENT '正数增加，负数减少',
    balance INT NOT NULL COMMENT '余额',
    description VARCHAR(500),
    category VARCHAR(20) COMMENT 'BOOK, PRIZE',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分记录表';

-- ============================================
-- 8. 奖品表 (prizes)
-- ============================================
DROP TABLE IF EXISTS prizes;
CREATE TABLE prizes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL COMMENT '奖品名称',
    points INT NOT NULL COMMENT '所需积分',
    stock INT DEFAULT 0 COMMENT '库存数量',
    image_data LONGTEXT COMMENT '奖品图片(base64)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='奖品表';

-- ============================================
-- 9. 奖品兑换表 (prize_exchanges)
-- ============================================
DROP TABLE IF EXISTS prize_exchanges;
CREATE TABLE prize_exchanges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(100),
    prize_id BIGINT NOT NULL,
    prize_name VARCHAR(200),
    points INT NOT NULL,
    quantity INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING, COMPLETED',
    exchange_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    pickup_time DATETIME,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='奖品兑换表';

-- ============================================
-- 10. 库存记录表 (inventory_records)
-- ============================================
DROP TABLE IF EXISTS inventory_records;
CREATE TABLE inventory_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    book_name VARCHAR(200),
    type VARCHAR(10) NOT NULL COMMENT 'IN, OUT',
    quantity INT NOT NULL,
    operator VARCHAR(100) COMMENT '操作员',
    remark VARCHAR(500),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_book_id (book_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存记录表';

-- ============================================
-- 11. 系统公告表 (announcements)
-- ============================================
DROP TABLE IF EXISTS announcements;
CREATE TABLE announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT COMMENT '公告内容',
    publisher VARCHAR(100) NOT NULL COMMENT '发布人',
    publisher_role VARCHAR(20) COMMENT 'ADMIN, LOGISTICS',
    publish_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统公告表';

-- ============================================
-- 12. 通知表 (notices)
-- ============================================
DROP TABLE IF EXISTS notices;
CREATE TABLE notices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    publisher VARCHAR(100) NOT NULL,
    publish_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ============================================
-- 13. 领取地点通知表 (location_notices)
-- ============================================
DROP TABLE IF EXISTS location_notices;
CREATE TABLE location_notices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(200) NOT NULL COMMENT '领取地点',
    notice TEXT COMMENT '领取须知内容',
    publisher VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    publish_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='领取地点通知表';


-- ============================================
-- 初始化测试数据
-- ============================================

-- 插入测试用户（密码都是 123456）
INSERT INTO users (username, password, role, name, college, major, class_name, entry_year, phone, points, emp_id, dept, position, workplace) VALUES
('202431100122', '123456', 'STUDENT', '李华', '信息科学与技术学院', '计算机科学与技术', '2201班', '2022年', '138****5678', 200, NULL, NULL, NULL, NULL),
('admin', '123456', 'ADMIN', '张老师', NULL, NULL, NULL, '2020年', '138****1234', 0, 'A2024001', '教材管理中心', '系统管理员', '行政楼A座305室'),
('logistics', '123456', 'LOGISTICS', '王师傅', NULL, NULL, NULL, '2018年', '159****5678', 0, 'B2018012', '后勤服务中心', '奖品发放员', '后勤中心3号窗口');

-- 插入专业分类
INSERT INTO categories (name, code, sort, status) VALUES
('计算机', '计算机', 1, 'ACTIVE'),
('经管', '经管', 2, 'ACTIVE'),
('外语', '外语', 3, 'ACTIVE'),
('数学', '数学', 4, 'ACTIVE'),
('电子工程', '电子工程', 5, 'ACTIVE');

-- 插入积分规则
INSERT INTO points_rules (rule_new, rule_good, rule_normal, rule_old, prize_max) VALUES
(200, 150, 80, 40, 500);

-- 插入奖品
INSERT INTO prizes (name, points, stock) VALUES
('甜点券', 120, 30),
('笔记本套装', 50, 50),
('帆布袋', 80, 40),
('文具礼包', 40, 60),
('咖啡券', 30, 100);

-- 验证
SELECT '数据初始化完成！' AS status;
SHOW TABLES;
```

> 💡 **使用方法**：
> 1. 复制以上全部 SQL 内容
> 2. 打开 MySQL 客户端（命令行或 Navicat、DBeaver 等工具）
> 3. 粘贴执行即可完成建库、建表、插入测试数据

### 表结构速览

| 表名 | 说明 | 主键 |
|------|------|------|
| `users` | 用户表 | id |
| `categories` | 分类表（专业分类） | id |
| `books` | 教材表 | id |
| `recycle_appointments` | 回收预约表 | id |
| `evaluations` | 评估表 | id |
| `points_rules` | 积分规则表 | id |
| `points_records` | 积分记录表 | id |
| `prizes` | 奖品表 | id |
| `prize_exchanges` | 奖品兑换表 | id |
| `inventory_records` | 库存记录表 | id |
| `announcements` | 系统公告表 | id |
| `notices` | 通知表 | id |
| `location_notices` | 领取地点通知表 | id |

---

## ⚠️ 常见问题

### 1. 编译报错 "找不到符号"
- 确保已安装 JDK 17
- 在 IntelliJ 中：File → Project Structure → Project → SDK 选择 17
- 执行：Maven → Reload Project

### 2. 数据库连接失败
- 确认 MySQL 服务已启动
- 检查用户名和密码是否正确
- 确认 `textbook_recycle` 数据库已创建

### 3. 页面显示异常或 API 请求失败
- 清除浏览器缓存，Ctrl+F5 强制刷新
- 确认端口 8080 未被占用
- 查看浏览器 Console 是否有报错

### 4. 热更新不生效
- 确保 `spring-boot-devtools` 依赖已添加
- 在 IDEA 中：Settings → Build → Compiler → 勾选 "Build project automatically"

---

## 🔒 安全建议

- 生产环境请修改 MySQL root 密码
- 生产环境请移除 `spring-boot-devtools` 依赖
- 生产环境请配置 HTTPS
- 建议添加密码加密存储（如 BCrypt）
- 建议添加接口权限控制注解

---

## 📝 开发指南

### 添加新的实体类

1. 在 `entity/` 包下创建类，添加 JPA 注解
2. 在 `repository/` 包下创建 Repository 接口
3. 在 `service/` 包下创建 Service 类
4. 在 `controller/` 包下创建 Controller 类
5. 前端在对应目录添加页面和 JS

### 前端页面导航

- 页面文件位置：`src/main/resources/static/`
- JS 文件：`src/main/resources/static/js/`
- 页面内引入：`/js/common.js` 和对应角色的 JS

---

## 📜 许可证

本项目仅供学习交流使用。

---

## 👨‍💻 作者

WangTuoLaLa - 2026

---

> 💡 如有问题，请检查控制台日志或提交 Issue。
