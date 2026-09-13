# 实施步骤：三套登录注册 + 用户类型体系

> 配套文档：`ADMIN-DESIGN.md`（设计）、`admin-console.html`（原型）

## 0. 权限约定

| 范围 | 权限 |
|---|---|
| `frontend/web`、`frontend/desktop` | 我可直接修改 |
| `backend/**` | **仅查看，修改前必须你授权** |

下文后端部分全部是**方案文档**，未执行任何改动。需要我动手时说一声。

---

## 1. 数据库改造

### 1.1 加用户类型字段

```sql
ALTER TABLE sys_user
  ADD COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'student'
  COMMENT '用户类型: student 学生 / teacher 老师 / admin 超管';

-- 存量数据处理：现有用户默认学生
UPDATE sys_user SET user_type = 'student' WHERE user_type IS NULL OR user_type = '';
```

### 1.2 初始化超管（示例，密码自己换成 BCrypt）

```sql
-- 密码需在应用内用 BCryptPasswordEncoder 生成后填入
INSERT INTO sys_user (account, username, password, user_type, status, deleted, create_time)
VALUES ('10000001', '超级管理员', '{bcrypt生成的密文}', 'admin', 1, 0, NOW());
```

> 超管**不开放注册**，只能这样内置或由超管在后台分配。

---

## 2. 后端改造（待授权）

### 2.1 新增枚举

新建 `common/enums/UserTypeEnum.java`：

```java
public enum UserTypeEnum {
    STUDENT("student", "学生"),
    TEACHER("teacher", "老师"),
    ADMIN("admin", "超管");

    @EnumValue
    private final String code;
    @Getter
    private final String desc;

    UserTypeEnum(String code, String desc) { this.code = code; this.desc = desc; }

    @JsonValue
    public String getCode() { return code; }

    @JsonCreator
    public static UserTypeEnum fromCode(String code) {
        for (UserTypeEnum e : values()) if (e.code.equals(code)) return e;
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的用户类型: " + code);
    }
}
```

### 2.2 实体加字段

`domain/entity/SysUser.java` 增加：

```java
@TableField("user_type")
@Schema(description = "用户类型")
private UserTypeEnum userType;
```

### 2.3 Service 改造

`SysUserServiceImpl` 现有 `register(dto, request)` 与 `login(dto, request)`，
改为接受类型参数，避免在 Controller 里散落判断：

```java
public SysUserLoginTokenVO register(SysUserRegisterDTO dto, HttpServletRequest request, UserTypeEnum type) {
    // ... 原有逻辑
    user.setUserType(type);   // ← 唯一新增
    save(user);
}

public SysUserLoginTokenVO login(SysUserLoginDTO dto, HttpServletRequest request, UserTypeEnum type) {
    // ... 原有三种登录方式分发逻辑不变
    // 在拿到 user 后增加校验：
    if (user.getUserType() != type) {
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "账号类型不匹配");
    }
}
```

### 2.4 Controller 拆接口

`SysUserController` 现有：
```
POST /sys/user/login
POST /sys/user/register
```

建议**保留现有路径作为学生端**（现有前端不用改），新增老师端与超管端：

| 路径 | 类型 | 说明 |
|---|---|---|
| `POST /sys/user/student/register` | `STUDENT` | 学生注册 ✅ 已完成 |
| `POST /sys/user/student/login` | `STUDENT` | 学生登录 ✅ 已完成 |
| `POST /sys/user/teacher/register` | `TEACHER` | 老师注册（待做） |
| `POST /sys/user/teacher/login` | `TEACHER` | 老师登录（待做） |
| `POST /sys/user/admin/login` | `SUPER_ADMIN` | 超管登录（待做） |

**实现方式**（已落地）：Service 暴露语义化方法 `studentLogin` / `studentRegister`，
类型在方法内部写死（`SET` 注册、`WHERE user_type = 'student'` 登录过滤），
**前端无法通过任何参数指定类型**。

> 登录时类型不符会报「账号未注册」而非「类型不匹配」，避免泄露账号是否存在。

```java
@PostMapping("/teacher/register")
public BaseResult<SysUserLoginTokenVO> registerTeacher(@Valid @RequestBody SysUserRegisterDTO dto,
                                                       HttpServletRequest request) {
    return BaseResult.ok(sysUserService.register(dto, request, UserTypeEnum.TEACHER));
}

@PostMapping("/admin/login")
public BaseResult<SysUserLoginTokenVO> loginAdmin(@Valid @RequestBody SysUserLoginDTO dto,
                                                  HttpServletRequest request) {
    return BaseResult.ok(sysUserService.login(dto, request, UserTypeEnum.ADMIN));
}
```

**安全要点**：`SysUserRegisterDTO` **绝不能接收 `userType` 字段**，
类型由接口硬编码，前端传什么都无效。

### 2.5 权限注解 + 拦截器

新建 `common/annotation/RequireType.java`：

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireType {
    UserTypeEnum[] value();
}
```

新建拦截器 `interceptor/RequireTypeInterceptor.java`，从 token 解析出 `userType` 后比对：

```java
RequireType ann = handlerMethod.getMethodAnnotation(RequireType.class);
if (ann == null) return true;
UserTypeEnum current = AuthContext.getUserType();
for (UserTypeEnum t : ann.value()) if (t == current) return true;
throw new BusinessException(ResultCodeEnum.FORBIDDEN, "无权访问");
```

用法：

```java
@RequireType({UserTypeEnum.STUDENT, UserTypeEnum.TEACHER})  // 业务接口，排除超管
@RequireType(UserTypeEnum.TEACHER)                          // 仅老师（如建课堂）
@RequireType(UserTypeEnum.ADMIN)                            // 仅超管（管理接口）
```

### 2.6 水平越权修复（5 处）

个人级数据必须校验 `user_id`。参考正确写法
`SysUserFeedbackServiceImpl.detail(Long id)`（已带 userId 条件）。

| 文件 | 方法 | 问题 |
|---|---|---|
| `SysUserApiKeyServiceImpl` | `deleteApiKey(Long id)` | 缺 userId 条件 |
| `SysUserApiKeyServiceImpl` | `testApiKey(Long id)` | 缺 userId 条件 |
| `SysUserTermLibraryServiceImpl` | `update(Long id, dto)` | 缺 userId 条件 |
| `SysUserTermLibraryServiceImpl` | `delete(Long id)` | 缺 userId 条件 |
| `SysUserTermEntryServiceImpl` | `listByLibraryId(Long libraryId)` | 缺 library 归属校验 |

统一修复模式：

```java
Long userId = sysUserService.getCurrentUser().getId();
Entity entity = lambdaQuery()
        .eq(Entity::getId, id)
        .eq(Entity::getUserId, userId)     // ← 新增
        .one();
if (entity == null) {
    throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "数据不存在");
}
```

> 建议抛「不存在」而非「无权限」，避免通过报错差异探测他人资源 id 是否存在。

### 2.7 登录返回体带上用户类型

`SysUserLoginTokenVO` 增加 `userType` 字段，前端据此渲染不同界面。

---

## 3. 前端改造（我可做）

### 3.1 平台端 `frontend/web`

需要三套入口：

| 入口 | 页面 | 调用接口 |
|---|---|---|
| 学生 | 登录 / 注册 | `/sys/user/student/login`、`/sys/user/student/register` ✅ |
| 老师 | 登录 / 注册 | `/sys/user/teacher/login`、`/sys/user/teacher/register` |
| 超管 | 登录 | `/sys/user/admin/login` |

- 登录后按返回的 `userType` 渲染对应导航
  - 学生：基础功能
  - 老师：基础功能 + 「开启课堂」
  - 超管：进超管端（不渲染任何业务功能）

### 3.2 超管端页面

基于 `admin-console.html` 原型转成真实 React 页面：

1. 运营数据看板
2. 用户管理
3. 教学数据（只读）
4. AI 用量
5. 反馈管理
6. 系统配置

导航支持「经典 / 星空」双模式切换。

### 3.3 桌面端 `frontend/desktop`

桌面端是 C 端，登录接口按使用者身份走学生或老师那一套。
超管**不允许登录桌面端**（后端用 `@RequireType` 挡住）。

---

## 4. 执行顺序建议

```
1. 数据库加字段              ← 你做
2. 后端：枚举 + 实体 + 类型  ← 需授权
3. 后端：拆登录注册接口      ← 需授权
4. 后端：注解 + 拦截器       ← 需授权
5. 前端：三套登录注册页      ← 我做（可先用 mock，后端好了再对接）
6. 后端：修 5 处越权        ← 需授权
7. 前端：超管端页面         ← 我做
```

第 5 步可与 2-4 步并行，前端先用 mock 数据。
