# 目录管理 API 文档

> **Base URL**: `http://localhost:3000/api/directory`

---

## 1. 列表 & 单项查询

### GET `/api/directory`

* **描述**

    * 不带 `id` 时，按 `feature`（必填）和可选的 `parent_id` 列出子目录
    * 带 `id` 时，返回单个目录项

* **Query 参数**

  | 参数          | 类型              | 必填 | 说明                       |
    | ----------- | --------------- | -- | ------------------------ |
  | `id`        | `string` (UUID) | 否  | 若提供，则忽略其它参数，查询此目录        |
  | `feature`   | `string`        | 是  | 目录所属功能区标识                |
  | `parent_id` | `string` (UUID) | 否  | 上级目录 ID，若不传或 `null`，则查根级 |

* **响应示例**

    * **列表**（200 OK）

      ```json
      [
        {
          "id": "1111-2222-3333-4444",
          "feature": "case",
          "parentId": null,
          "name": "根目录 A",
          "position": 0,
          "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
          "createdAt": "2025-05-10T02:00:00Z",
          "updatedAt": "2025-05-10T02:00:00Z"
        }
      ]
      ```
    * **单项**（200 OK）

      ```json
      {
        "id": "1111-2222-3333-4444",
        "feature": "case",
        "parentId": null,
        "name": "根目录 A",
        "position": 0,
        "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
        "createdAt": "2025-05-10T02:00:00Z",
        "updatedAt": "2025-05-10T02:00:00Z"
      }
      ```
    * **未找到**（404）

      ```json
      { "error": "Not found" }
      ```

---

## 2. 创建目录

### POST `/api/directory`

* **描述**：新增一条目录记录
* **请求 Body** (`application/json`)

  ```json
  {
    "feature": "case",          
    "parent_id": null,           
    "name": "新目录名称"       
  }
  ```
* **响应**

    * **成功**（201 Created）

      ```json
      {
        "id": "new-uuid-1234",
        "feature": "case",
        "parentId": null,
        "name": "新目录名称",
        "position": 1,
        "createdBy": "dfde3322-6749-4071-ad31-e58123bfdc01",
        "createdAt": "2025-05-10T03:00:00Z",
        "updatedAt": "2025-05-10T03:00:00Z"
      }
      ```
    * **参数缺失**（400 Bad Request）

      ```json
      { "error": "Missing feature or name" }
      ```

---

## 3. 更新目录

### PUT `/api/directory`

* **描述**：修改已有目录的 `name` 或 `parent_id`
* **请求 Body** (`application/json`)

  ```json
  {
    "id": "existing-uuid-1111",
    "name": "重命名后的目录",
    "parent_id": "uuid-or-null"
  }
  ```
* **响应**

    * **成功**（200 OK）返回更新后记录
    * **未找到**（404 Not Found）返回 `{ "error": "Not found" }`
    * **参数缺失**（400 Bad Request）返回 `{ "error": "Missing id" }`

---

## 4. 删除目录

### DELETE `/api/directory?id=xxx`

* **描述**：删除指定目录
* **Query 参数**

  | 参数   | 类型              | 必填 | 说明        |
    | ---- | --------------- | -- | --------- |
  | `id` | `string` (UUID) | 是  | 要删除的目录 ID |
* **响应**

    * **成功**（200 OK） 返回 `{ "success": true }`
    * **未找到**（404 Not Found） 返回 `{ "error": "Not found" }`
    * **参数缺失**（400 Bad Request） 返回 `{ "error": "Missing id" }`

---

## 5. 排序目录

### PATCH `/api/directory/order`

* **描述**：批量更新同级目录的 `position`
* **请求 Body** (`application/json`)

  ```json
  {
    "feature": "case",
    "parent_id": null,
    "ordered_ids": [
      "uuid-A",
      "uuid-B",
      "uuid-C"
    ]
  }
  ```
* **响应**

    * **成功**（200 OK） 返回 `{ "success": true }`
    * **参数无效**（400 Bad Request） 返回 `{ "error": "Invalid params" }`

---

## 测试示例 (curl)

```bash
# 1) 列出根级目录
curl -i -X GET "http://localhost:3000/api/directory?feature=case" \
     -b cookie.txt

# 2) 列出子目录
curl -i -X GET "http://localhost:3000/api/directory?feature=case&parent_id=f2267416-7928-44d7-a4b5-d561da559b40" \
     -b cookie.txt

# 3) 查询单条
curl -i -X GET "http://localhost:3000/api/directory?id=f2267416-7928-44d7-a4b5-d561da559b40" \
     -b cookie.txt

# 4) 新建根目录
curl -i -X POST "http://localhost:3000/api/directory" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"feature":"case","name":"新根目录X"}'

# 5) 重命名目录
curl -i -X PUT "http://localhost:3000/api/directory" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"id":"f2267416-7928-44d7-a4b5-d561da559b40","name":"重命名根目录"}'

# 6) 删除目录
curl -i -X DELETE "http://localhost:3000/api/directory?id=4fbc0d78-da52-48ee-b949-b276ab461bf5" \
     -b cookie.txt

# 7) 排序目录
curl -i -X PATCH "http://localhost:3000/api/directory/order" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"feature":"case","parent_id":null,"ordered_ids":["uuid-A","uuid-B","uuid-C"]}'
```
