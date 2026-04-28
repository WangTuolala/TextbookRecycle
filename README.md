# 二手教材回收与共享管理系统

> A Spring Boot-based textbook recycling and sharing management system for universities.

---

## 📖 项目介绍

**二手教材回收与共享管理系统** 是一个面向大学校园的教材循环利用平台。系统连接学生、管理员和后勤三方，实现教材回收、评估、入库、兑换的全流程数字化管理，帮助减少教材浪费，促进资源循环利用。

### 核心功能模块

| 模块 | 功能描述 |
|------|----------|
| **用户管理** | 学生、管理员、后勤三种角色注册登录；密码修改 |
| **教材回收** | 学生提交回收预约，管理员审核/拒绝 |
| **评估定级** | 管理员对回收教材评估定级（全新/良好/一般/陈旧），核算积分并上架 |
| **积分系统** | 教材评估后获得积分；奖品/教材兑换时扣除积分 |
| **教材兑换** | 学生用积分兑换教材，管理员确认出库 |
| **奖品兑换** | 学生用积分兑换奖品，后勤确认领取 |
| **库存管理** | 入库/出库/盘点；全部库存聚合视图；库存预警 |
| **公告通知** | 系统公告（管理员/后勤发布）；领取须知；已读/未读跟踪 |
| **数据统计** | 兑换率饼图/学科分类统计/累计兑换/预警卡片 |

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
| **认证** | JWT |

---

## 🗂️ 项目结构

```
LL/
├── pom.xml
├── README.md
└── src/main/java/com/gluniversity/textbookrecyclesys/
    ├── TextbookRecycleSysApplication.java      # 应用入口
    ├── config/
    │   ├── DataInitializer.java               # 测试账号初始化
    │   └── WebConfig.java                    # CORS / 静态资源
    ├── controller/
    │   ├── AuthController.java               # 登录 / 注册
    │   ├── AdminController.java              # 管理员所有接口
    │   ├── LogisticsController.java           # 后勤所有接口
    │   └── StudentController.java             # 学生所有接口
    ├── service/
    │   ├── UserService.java                  # 用户 / 密码管理
    │   ├── BookService.java                  # 教材 CRUD
    │   ├── RecycleService.java               # 回收预约 / 评估
    │   ├── InventoryService.java             # 入库 / 出库 / 盘点
    │   ├── PrizeService.java                 # 奖品管理 / 兑换
    │   ├── AnnouncementService.java          # 公告 / 已读跟踪
    │   └── CategoryService.java              # 分类管理
    ├── repository/                            # JPA Repository
    ├── entity/                                # 实体类（JPA Entity）
    └── dto/                                   # API 请求/响应结构
```

**静态资源**：`src/main/resources/static/`
- `index.html` — 登录/注册页（含三角色注册表单）
- `admin/` — 管理端页面（评估审核/书籍管理/库存管理/分类管理/数据统计/...)
- `student/` — 学生端页面（集市/兑换/积分/回收预约/公告/...)
- `logistics/` — 后勤端页面（领取管理/奖品管理/公告/...)
- `js/` — `common.js` / `auth.js` / `admin.js` / `student.js` / `logistics.js`

---

## 🔧 环境准备

### 1. JDK 17
```bash
# Windows 下载地址：https://adoptium.net/temurin/releases/?version=17
java -version   # 验证

# macOS
brew install openjdk@17
```

### 2. MySQL 8.0
```bash
# Windows 下载：https://dev.mysql.com/downloads/mysql/
# 启动服务后连接
mysql -u root -p
```

### 3. Maven
```bash
mvn -version
```

---

## 🚀 项目配置与运行

### 1. 创建数据库

```sql
CREATE DATABASE textbook_recycle
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

### 2. 修改数据库配置

`src/main/resources/application.properties`：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/textbook_recycle?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
server.port=8080
```

> ⚠️ 将 `YOUR_PASSWORD` 替换为实际 MySQL root 密码。

### 3. 启动

**IntelliJ IDEA：**
找到 `TextbookRecycleSysApplication.java` → 右键 Run

**Maven 命令行：**
```bash
mvn spring-boot:run
# 或打包后运行
mvn clean package -DskipTests
java -jar target/textbook-recycle-system-0.0.1-SNAPSHOT.jar
```

**访问：** http://localhost:8080

---

## 👤 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 学生 | 202431100122 | 123456 | 参与教材回收和兑换 |
| 管理员 | admin | 123456 | 审核、评估、库存、统计 |
| 后勤 | logistics | 123456 | 奖品管理、领取确认、发布须知 |

---

## 📊 数据库表结构

> 以下为当前数据库实际表结构。JPA `ddl-auto=update`，实体字段变更会自动同步表结构。

---

### 表总览

| 表名 | 说明 |
|------|------|
| `users` | 用户表（学生/管理员/后勤） |
| `categories` | 专业分类表（ACTIVE / INACTIVE） |
| `books` | 教材表（LISTED / DELISTED） |
| `recycle_appointments` | 回收预约表（PENDING / APPROVED / REJECTED / COMPLETED） |
| `evaluations` | 评估表（PENDING / APPROVED / SYNCED / REJECTED） |
| `points_rules` | 积分规则表 |
| `points_records` | 积分记录表（RECYCLE 获得 / EXCHANGE 消耗） |
| `book_exchanges` | 教材兑换表（COMPLETED） |
| `prizes` | 奖品表 |
| `prize_exchanges` | 奖品兑换表（PENDING / COMPLETED） |
| `inventory_records` | 库存记录表（IN / OUT） |
| `stock_checks` | 盘点记录表 |
| `announcements` | 系统公告表 |
| `announcement_read` | 公告已读跟踪表 |
| `location_notices` | 领取地点须知表 |
| `notices` | 通知表（legacy） |
| `notifications` | 学生通知表 |

---

### 1. users（用户表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `username` | varchar(255) | UNI | 用户名 |
| `password` | varchar(255) | | 密码 |
| `role` | varchar(50) | | `STUDENT` / `ADMIN` / `LOGISTICS` |
| `name` | varchar(100) | | 姓名 |
| `phone` | varchar(50) | | 联系电话 |
| `college` | varchar(200) | | 学院 |
| `major` | varchar(200) | | 专业 |
| `class_name` | varchar(100) | | 班级 |
| `year` | varchar(50) | | 年份 |
| `emp_id` | varchar(100) | | 工号 |
| `dept` | varchar(200) | | 部门 |
| `position` | varchar(100) | | 岗位（管理员/后勤注册时填写） |
| `workplace` | varchar(500) | | 工作地点 |
| `points` | int | | 当前积分余额（仅学生） |
| `create_time` | timestamp | | 创建时间 |
| `entry_year` | varchar(255) | | 入学/入职年份 |

---

### 2. categories（专业分类表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `name` | varchar(100) | | 分类名称（如"计算机"） |
| `code` | varchar(100) | | 分类编码 |
| `sort` | int | | 排序 |
| `status` | varchar(50) | | `ACTIVE` 正常 / `INACTIVE` 停用 |
| `create_time` | timestamp | | 创建时间 |

> **说明**：停用分类下的教材仍可见可兑换（类似"停售"处理）。

---

### 3. books（教材表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `name` | varchar(500) | | 书名 |
| `author` | varchar(500) | | 作者 |
| `publisher` | varchar(500) | | 出版社 |
| `isbn` | varchar(100) | | ISBN |
| `major` | varchar(100) | | 所属专业 |
| `condition` | varchar(50) | | 品相（全新/良好/一般/陈旧） |
| `points` | int | | 兑换所需积分 |
| `stock` | int | | 当前库存 |
| `cover_image` | longtext | | 封面图（Base64） |
| `status` | varchar(50) | | `LISTED` 上架 / `DELISTED` 下架 |
| `create_time` | timestamp | | 创建时间 |
| `update_time` | timestamp | | 更新时间 |

---

### 4. recycle_appointments（回收预约表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `appointment_id` | varchar(100) | | 预约编号（AP-YYYYMMDD-XXX） |
| `student_id` | bigint | | 学生ID |
| `student_name` | varchar(100) | | 学生姓名 |
| `student_username` | varchar(255) | | 学生用户名 |
| `book_name` | varchar(500) | | 书名 |
| `isbn` | varchar(100) | | ISBN |
| `publisher` | varchar(500) | | 出版社 |
| `condition` | varchar(50) | | 学生自评品相 |
| `quantity` | int | | 本数 |
| `remark` | text | | 备注 |
| `cover_image` | longtext | | 封面图 |
| `author` | varchar(500) | | 作者 |
| `status` | varchar(50) | | `PENDING` 待审核 / `APPROVED` 已通过 / `REJECTED` 已拒绝 / `COMPLETED` 已完成 |
| `submit_time` | timestamp | | 提交时间 |

---

### 5. evaluations（评估表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `appointment_id` | varchar(100) | | 关联预约编号 |
| `student_id` | bigint | | 学生ID |
| `student_name` | varchar(100) | | 学生姓名 |
| `student_username` | varchar(255) | | 学生用户名 |
| `book_name` | varchar(500) | | 书名 |
| `author` | varchar(500) | | 作者 |
| `publisher` | varchar(500) | | 出版社 |
| `isbn` | varchar(100) | | ISBN |
| `self_condition` | varchar(50) | | 学生自评品相 |
| `admin_condition` | varchar(50) | | 管理员评定品相 |
| `points` | int | | 评估积分 |
| `cover_image` | longtext | | 封面图 |
| `remark` | text | | 管理员备注 |
| `quantity` | int | | 数量 |
| `status` | varchar(50) | | `PENDING` 待处理 / `APPROVED` 已通过 / `SYNCED` 已同步 / `REJECTED` 已拒绝 |
| `submit_time` | timestamp | | 提交时间 |
| `evaluate_time` | timestamp | | 评估时间 |

> **状态流转**：`PENDING` →（通过）`APPROVED` →（同步积分）`SYNCED`；`PENDING` →（拒绝）`REJECTED`
>
> **注意**：评估页面已移除上架按钮，上架操作需在书籍管理页面完成。评估状态只显示 PENDING / APPROVED / SYNCED / REJECTED，LISTED / DELISTED 状态不在此处流转。

---

### 6. points_rules（积分规则表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint | 主键 |
| `rule_new` | int | 全新书积分（默认200） |
| `rule_good` | int | 良好书积分（默认150） |
| `rule_normal` | int | 一般书积分（默认80） |
| `rule_old` | int | 陈旧书积分（默认40） |
| `prize_max` | int | 单次兑换上限（默认500） |

---

### 7. points_records（积分记录表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `user_id` | bigint | | 用户ID |
| `user_name` | varchar(100) | | 用户姓名 |
| `type` | varchar(50) | | `RECYCLE` 获得 / `EXCHANGE` 消耗 |
| `points` | int | | 积分变动（正数增加，负数减少） |
| `balance` | int | | 变动后余额 |
| `description` | varchar(500) | | 描述 |
| `category` | varchar(50) | | `BOOK` 教材 / `PRIZE` 奖品 |
| `create_time` | timestamp | | 创建时间 |

---

### 8. book_exchanges（教材兑换表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `student_id` | bigint | | 学生ID |
| `student_name` | varchar(255) | | 学生姓名 |
| `book_id` | bigint | | 教材ID |
| `book_name` | varchar(255) | | 书名 |
| `quantity` | int | | 兑换数量 |
| `points_cost` | int | | 消耗积分 |
| `cover_image` | longtext | | 教材封面（快照） |
| `status` | varchar(20) | | `COMPLETED` 已完成 |
| `exchange_time` | datetime(6) | | 兑换时间 |

> **说明**：学生兑换教材时记录，COMPLETED 后扣减库存和积分。

---

### 9. prizes（奖品表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint | 主键 |
| `name` | varchar(200) | 奖品名称 |
| `points` | int | 所需积分 |
| `stock` | int | 库存数量 |
| `image_data` | longtext | 奖品图片（Base64） |
| `create_time` | timestamp | 创建时间 |

---

### 10. prize_exchanges（奖品兑换表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `student_id` | bigint | | 学生ID |
| `student_name` | varchar(100) | | 学生姓名 |
| `prize_id` | bigint | | 奖品ID |
| `prize_name` | varchar(200) | | 奖品名称（快照） |
| `points` | int | | 消耗积分 |
| `quantity` | int | | 兑换数量 |
| `status` | varchar(50) | | `PENDING` 待领取 / `COMPLETED` 已领取 |
| `exchange_time` | timestamp | | 申请时间 |
| `pickup_time` | timestamp | | 领取时间 |

---

### 11. inventory_records（库存记录表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `book_id` | bigint | | 教材ID |
| `book_name` | varchar(500) | | 教材名称 |
| `isbn` | varchar(100) | | ISBN |
| `type` | varchar(50) | | `IN` 入库 / `OUT` 出库 |
| `quantity` | int | | 数量（正数） |
| `operator` | varchar(100) | | 操作员姓名 |
| `remark` | varchar(500) | | 备注 |
| `create_time` | timestamp | | 操作时间 |

---

### 12. stock_checks（盘点记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint | 主键 |
| `book_id` | bigint | 教材ID |
| `book_name` | varchar(255) | 书名 |
| `isbn` | varchar(255) | ISBN |
| `system_stock` | int | 系统库存（Book.stock） |
| `actual_stock` | int | 实际盘点数量 |
| `diff` | int | 差异（actual - system） |
| `operator` | varchar(255) | 经手人 |
| `remark` | varchar(255) | 备注 |
| `check_time` | datetime(6) | 盘点时间 |

---

### 13. announcements（系统公告表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint | 主键 |
| `title` | varchar(500) | 标题 |
| `content` | text | 内容 |
| `publisher` | varchar(100) | 发布人 |
| `publisher_role` | varchar(50) | 发布人角色 `ADMIN` / `LOGISTICS` |
| `publish_time` | timestamp | 发布时间 |

---

### 14. announcement_read（公告已读跟踪表）

| 字段 | 类型 | 键 | 说明 |
|------|------|----|------|
| `id` | bigint | PK | 主键 |
| `student_id` | bigint | | 学生ID |
| `announcement_id` | bigint | MUL | 公告ID |
| `type` | varchar(50) | | 公告类型 |
| `is_read` | tinyint(1) | | 是否已读 |
| `read_at` | datetime | | 阅读时间 |

---

### 15. location_notices（领取地点须知表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint | 主键 |
| `location` | varchar(500) | 领取地点 |
| `notice` | text | 领取须知内容 |
| `publisher` | varchar(100) | 发布人 |
| `publisher_role` | varchar(255) | 发布人角色 |
| `is_active` | tinyint(1) | 是否激活 |
| `publish_time` | timestamp | 发布时间 |

---

### 16. notifications（学生通知表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint | 主键 |
| `student_id` | bigint | 学生ID |
| `student_name` | varchar(255) | 学生姓名 |
| `title` | varchar(255) | 通知标题 |
| `content` | text | 通知内容 |
| `type` | varchar(255) | 通知类型 |
| `related_id` | bigint | 关联ID |
| `is_read` | bit(1) | 是否已读 |
| `create_time` | datetime(6) | 创建时间 |

---

## 🔌 主要 API 接口

> Base URL: `/api`

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 登录 |
| POST | `/auth/register` | 注册 |
| PUT | `/auth/password` | 修改密码（所有角色） |

### 学生接口 `/student`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/student/profile` | 个人信息 |
| PUT | `/student/profile` | 更新个人信息 |
| PUT | `/student/password` | 修改密码 |
| GET | `/student/points` | 积分信息 + 明细 |
| GET | `/student/books` | 可兑换教材（已上架+库存>0） |
| GET | `/student/majors` | 可用专业列表 |
| GET | `/student/exchanges` | 教材兑换记录 |
| POST | `/student/exchanges` | 兑换教材 |
| GET | `/student/appointments` | 回收预约记录 |
| POST | `/student/appointments` | 提交回收预约 |
| GET | `/student/announcements` | 公告列表（含已读状态） |
| GET | `/student/location-notice` | 领取须知 |

### 管理员接口 `/admin`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/appointments` | 预约列表 |
| POST | `/admin/appointments/{id}/approve` | 审核通过 |
| POST | `/admin/appointments/{id}/reject` | 拒绝预约 |
| GET | `/admin/evaluations` | 评估列表（?status=筛选） |
| POST | `/admin/evaluations/{id}/approve` | 评估通过 |
| POST | `/admin/evaluations/{id}/reject` | 评估拒绝 |
| PUT | `/admin/evaluations/{id}/condition` | 更新品相+积分 |
| POST | `/admin/evaluations/{id}/sync` | 同步积分 |
| GET | `/admin/books` | 教材列表 |
| POST | `/admin/books` | 新增教材 |
| PUT | `/admin/books/{id}` | 更新教材 |
| PUT | `/admin/books/{id}/status` | 上架/下架 |
| GET | `/admin/categories` | 分类列表 |
| POST | `/admin/categories` | 新增分类 |
| PUT | `/admin/categories/{id}` | 更新分类 |
| PUT | `/admin/categories/{id}/status` | 启用/停用分类 |
| GET | `/admin/points-rule` | 积分规则 |
| PUT | `/admin/points-rule` | 更新积分规则 |
| GET | `/admin/announcements` | 公告列表 |
| POST | `/admin/announcements` | 发布公告 |
| DELETE | `/admin/announcements/{id}` | 删除公告 |
| GET | `/admin/stats/charts` | 图表统计数据 |
| GET | `/admin/stats/overview` | 概览统计 |
| GET | `/admin/inventory/books` | 全部库存（聚合视图） |
| GET | `/admin/inventory/summary` | 库存汇总 |
| GET | `/admin/inventory/in` | 入库记录 |
| POST | `/admin/inventory/in` | 新增入库 |
| GET | `/admin/inventory/out` | 出库记录 |
| POST | `/admin/inventory/out` | 新增出库 |
| GET | `/admin/stock-checks` | 盘点记录 |
| POST | `/admin/stock-checks` | 新增盘点 |
| GET | `/admin/book-exchanges` | 教材兑换记录 |
| PUT | `/admin/password` | 修改密码 |

### 后勤接口 `/logistics`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/logistics/profile` | 个人信息 |
| PUT | `/logistics/profile` | 更新个人信息 |
| GET | `/logistics/exchanges/pending` | 待领取列表 |
| GET | `/logistics/exchanges/completed` | 已领取列表 |
| POST | `/logistics/exchanges/{id}/pickup` | 确认领取 |
| GET | `/logistics/prizes` | 奖品列表 |
| POST | `/logistics/prizes` | 新增奖品 |
| PUT | `/logistics/prizes/{id}` | 更新奖品 |
| DELETE | `/logistics/prizes/{id}` | 删除奖品 |
| GET | `/logistics/announcements` | 公告列表 |
| POST | `/logistics/announcements` | 发布公告 |
| DELETE | `/logistics/announcements/{id}` | 删除公告 |
| GET | `/logistics/location-notices` | 领取须知 |
| POST | `/logistics/location-notices` | 发布须知 |
| DELETE | `/logistics/location-notices/{id}` | 删除须知 |
| PUT | `/logistics/password` | 修改密码 |

---

## ⚠️ 常见问题

### 1. 编译报错 "找不到符号"
- 确认 JDK 17 已安装，IDEA 中 File → Project Structure → SDK 选择 17
- Maven → Reload Project 重新索引

### 2. 数据库连接失败
- 确认 MySQL 服务已启动
- 检查 `application.properties` 中密码是否正确
- 确认 `textbook_recycle` 数据库已创建

### 3. 页面显示异常
- 清除浏览器缓存，Ctrl+F5 强制刷新
- 确认端口 8080 未被占用

---

## 🔒 安全建议

- 生产环境请修改 MySQL 密码
- 生产环境建议配置 HTTPS
- 建议使用 BCrypt 密码加密
- 建议添加接口权限控制注解

---

## 📜 许可证

本项目仅供学习交流使用。

---

## 👨‍💻 作者

WangTuoLaLa - 2026
