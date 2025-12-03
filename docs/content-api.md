# 通用 Content API 文档

> **Base URL**：`http://localhost:3000/api/content`
> 所有接口均需认证（Cookie 中包含 `sessionToken` 或 `Authorization: Bearer <token>`）。

后端根据 URL 或请求体里的 `feature` 参数，动态操作对应的 `${feature}_content` 表。下面以 `feature=case`（即表 `case_content`）为示例说明。

---

## 1. 列表 & 单条查询

### GET `/api/content`

* **用途**

  * **单条查询**：通过 `id` 参数获取一条内容
  * **列表查询**：通过 `feature` + `directory_id` 参数获取该目录下所有内容

* **Query 参数**

  | 参数             | 类型              | 必填 | 说明                          |
    | -------------- | --------------- | -- | --------------------------- |
  | `feature`      | `string`        | 是  | 功能标识（例如 `"case"`、`"diary"`） |
  | `id`           | `string` (UUID) | 否  | 若提供，则返回单条                   |
  | `directory_id` | `string` (UUID) | 否  | 若提供，则返回该目录下的列表              |

* **响应示例**

  * **列表** （200 OK）

    ```json
    [
      {
        "id": "uuid-item-1111",
        "directoryId": "uuid-dir-2222",
        "title": "案例标题 A",
        "summary": "概要 A",
        "body": "详细内容 A",
        "position": 0,
        "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
        "createdAt": "2025-05-10T06:00:00Z",
        "updatedAt": "2025-05-10T06:00:00Z"
      },
      {
        "id": "uuid-item-2222",
        "directoryId": "uuid-dir-2222",
        "title": "案例标题 B",
        "summary": "概要 B",
        "body": "详细内容 B",
        "position": 1,
        "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
        "createdAt": "2025-05-10T06:05:00Z",
        "updatedAt": "2025-05-10T06:05:00Z"
      }
    ]
    ```

  * **单条** （200 OK）

    ```json
    {
      "id": "uuid-item-1111",
      "directoryId": "uuid-dir-2222",
      "title": "案例标题",
      "summary": "概要信息",
      "body": "正文内容",
      "position": 0,
      "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
      "createdAt": "2025-05-10T06:00:00Z",
      "updatedAt": "2025-05-10T06:00:00Z"
    }
    ```

* **可能的错误**

  * **400 Bad Request**

    ```json
    { "error": "Missing feature" }
    ```
  * **404 Not Found**

    ```json
    { "error": "Not found" }
    ```

---

## 2. 创建内容

### POST `/api/content`

* **描述**：在指定目录下创建一条新内容

* **Request Body** (`application/json`)

  ```jsonc
  {
    "feature":       "case",            // 必填，功能标识
    "directory_id":  "uuid-dir-2222",   // 必填
    "title":         "新案例标题",        // 必填
    "summary":       "概要描述",         // 可选
    "body":          "详细内容文本"      // 可选
  }
  ```

* **响应**

  * **成功** （201 Created）

    ```json
    {
      "id": "uuid-newitem-3333",
      "directoryId": "uuid-dir-2222",
      "title": "新案例标题",
      "summary": "概要描述",
      "body": "详细内容文本",
      "position": 2,
      "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
      "createdAt": "2025-05-10T06:10:00Z",
      "updatedAt": "2025-05-10T06:10:00Z"
    }
    ```

  * **400 Bad Request** （缺少必填字段）

    ```json
    { "error": "feature, directory_id and title are required" }
    ```

---

## 3. 更新内容

### PUT `/api/content`

* **描述**：修改已有内容

* **Request Body** (`application/json`)

  ```jsonc
  {
    "feature":       "case",            // 必填
    "id":            "uuid-item-1111",  // 必填
    "directory_id":  "uuid-dir-2222",   // 可选，移动目录
    "title":         "更新标题",         // 可选
    "summary":       "更新概要",         // 可选
    "body":          "更新内容"         // 可选
  }
  ```

* **响应**

  * **成功** （200 OK） 返回更新后的对象
  * **400 Bad Request**

    ```json
    { "error": "feature and id are required" }
    ```
  * **404 Not Found**

    ```json
    { "error": "Not found" }
    ```

---

## 4. 删除内容

### DELETE `/api/content`

* **描述**：删除一条内容

* **Query 参数**

  | 参数        | 类型              | 必填 | 说明    |
    | --------- | --------------- | -- | ----- |
  | `feature` | `string`        | 是  | 功能标识  |
  | `id`      | `string` (UUID) | 是  | 内容 ID |

* **响应**

  * **成功** （200 OK）

    ```json
    { "success": true }
    ```
  * **400 Bad Request**

    ```json
    { "error": "feature and id are required" }
    ```
  * **404 Not Found**

    ```json
    { "error": "Not found" }
    ```

---

## 5. 排序内容

### PATCH `/api/content`

* **描述**：批量更新同目录下的内容顺序

* **Request Body** (`application/json`)

  ```jsonc
  {
    "feature":       "case",            // 必填
    "directory_id":  "uuid-dir-2222",   // 必填
    "ordered_ids":   [                  // 必填，按新顺序列出
      "uuid-item-2222",
      "uuid-item-1111",
      "uuid-item-3333"
    ]
  }
  ```

* **响应**

  * **成功** （200 OK）

    ```json
    { "success": true }
    ```
  * **400 Bad Request**

    ```json
    { "error": "feature, directory_id and ordered_ids required" }
    ```

---

## Curl 示例

```bash
# 列表
curl -i -X GET "http://localhost:3000/api/content?feature=case&directory_id=uuid-dir-2222" \
     -b cookie.txt

# 单条
curl -i -X GET "http://localhost:3000/api/content?feature=case&id=uuid-item-1111" \
     -b cookie.txt

# 创建
curl -i -X POST "http://localhost:3000/api/content" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"feature":"case","directory_id":"uuid-dir-2222","title":"新案例","summary":"概要","body":"内容"}'

# 更新
curl -i -X PUT "http://localhost:3000/api/content" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"feature":"case","id":"uuid-item-1111","title":"更新标题"}'

# 删除
curl -i -X DELETE "http://localhost:3000/api/content?feature=case&id=uuid-item-1111" \
     -b cookie.txt

# 排序
curl -i -X PATCH "http://localhost:3000/api/content" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"feature":"case","directory_id":"uuid-dir-2222","ordered_ids":["uuid-item-2222","uuid-item-1111","uuid-item-3333"]}'
```
