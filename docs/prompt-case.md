# API 文档

## 目录

* [Prompt Case List 接口](#prompt-case-list-%E6%8E%A5%E5%8F%A3)

    * [GET `/api/prompt/case/list`](#get-apipromptcaselist)
    * [GET `/api/prompt/case/list?id=...`](#get-apipromptcaselistid)
    * [POST `/api/prompt/case/list`](#post-apipromptcaselist)
    * [PUT `/api/prompt/case/list`](#put-apipromptcaselist)
    * [DELETE `/api/prompt/case/list?id=...`](#delete-apipromptcaselistid)
    * [PATCH `/api/prompt/case/list`](#patch-apipromptcaselist)
    * [GET `/api/prompt/case/list/{caseListId}/image`](#get-apipromptcaselistcaseListIdimage)
    * [POST `/api/prompt/case/list/{caseListId}/image`](#post-apipromptcaselistcaseListIdimage)
    * [DELETE `/api/prompt/case/list/image/{imgId}`](#delete-apipromptcaselistimageimgid)

* [Prompt Test Detail 接口](#prompt-test-detail-%E6%8E%A5%E5%8F%A3)

    * [GET `/api/prompt/case/test`](#get-apipromptcasetestroute)
    * [POST `/api/prompt/case/test`](#post-apipromptcasetestroute)
    * [DELETE `/api/prompt/case/test?id=...`](#delete-apipromptcasetestrouteid)

---

## Prompt Case List 接口

### GET `/api/prompt/case/list`

* **功能**：根据 `content_id` 查询所有 CaseList 或根据 `id` 查询单条。
* **URL 参数**：

    * `content_id` (string, 可选) — CaseContent 主键
    * `id` (string, 可选) — PromptCaseList 主键
* **示例**：

  ```http
  GET /api/prompt/case/list?content_id=123e4567-e89b-12d3-a456-426614174000
  ```
* **响应**：

  ```json
  // 列表模式
  [
    {
      "id": "...",
      "caseContentId": "...",
      "seq": 1,
      "caseText": "示例用例文本",
      "groundTruth": "正确答案",
      "createdAt": "2025-05-11T10:00:00Z",
      "updatedAt": "2025-05-11T10:00:00Z"
    },
    ...
  ]
  ```

### GET `/api/prompt/case/list?id=...`

* 等同于带 `id` 参数的 GET，返回单条记录。若未找到返回 404。响应体同上单元素。

### POST `/api/prompt/case/list`

* **功能**：创建新的 PromptCaseList。
* **请求体 (JSON)**：

  ```json
  {
    "case_content_id": "123e...",
    "seq": 1,
    "case_text": "用例 A",
    "ground_truth": "答案 X"
  }
  ```
* **响应 (201 Created)**：

  ```json
  {
    "id": "...",
    "caseContentId": "...",
    "seq": 1,
    "caseText": "用例 A",
    "groundTruth": "答案 X",
    "createdAt": "2025-05-11T10:05:00Z",
    "updatedAt": "2025-05-11T10:05:00Z"
  }
  ```

### PUT `/api/prompt/case/list`

* **功能**：完整更新一条 CaseList。必须在请求体包含 `id`。
* **请求体 (JSON)**：

  ```json
  {
    "id": "...",
    "seq": 2,
    "case_text": "更新后的文本",
    "ground_truth": "更新后的答案"
  }
  ```
* **响应**：

  ```json
  { "success": true }
  ```

### DELETE `/api/prompt/case/list?id=...`

* **功能**：删除指定 CaseList。
* **URL 参数**：

    * `id` (string) — 要删除的记录主键
* **响应**：

  ```json
  { "success": true }
  ```

### PATCH `/api/prompt/case/list`

* **功能**：重新按前端顺序排序。
* **请求体 (JSON)**：

  ```json
  {
    "content_id": "123e...",
    "ordered_ids": ["id1", "id2", "id3"]
  }
  ```
* **响应**：

  ```json
  { "success": true }
  ```

### GET `/api/prompt/case/list/{caseListId}/image`

* **功能**：列出某个 CaseList 的所有图片。
* **路径参数**：

    * `caseListId` (string)
* **响应**：

  ```json
  [
    {"id":"...","caseListId":"...","imageUrl":"/uploads/1.png","position":1,"createdAt":"..."},
    ...
  ]
  ```

### POST `/api/prompt/case/list/{caseListId}/image`

* **功能**：为某 CaseList 添加一张图片。
* **请求体 (JSON)**：

  ```json
  { "url": "/uploads/new.png", "position": 2 }
  ```
* **响应**：204 No Content

### DELETE `/api/prompt/case/list/image/{imgId}`

* **功能**：删除指定图片。
* **路径参数**：

    * `imgId` (string)
* **响应**：204 No Content

---

## Prompt Test Detail 接口

### GET `/api/prompt/case/test?case_list_id=...`

* **功能**：查询某 CaseList 的所有测试记录。
* **URL 参数**：

    * `case_list_id` (string)
* **响应**：

  ```json
  [
    {
      "id": "...",
      "caseListId": "...",
      "modelName": "GPT-4",
      "testResult": "输出...",
      "passed": true,
      "reason": null,
      "testTime": "2025-05-11T10:10:00Z",
      "traceId": "abc123"
    },
    ...
  ]
  ```

### POST `/api/prompt/case/test`

* **功能**：新增一条测试明细。
* **请求体 (JSON)**：

  ```json
  {
    "case_list_id": "...",
    "model_name": "GPT-4",
    "test_result": "结果文本",
    "passed": false,
    "reason": "输出错误原因",
    "trace_id": "xyz789"
  }
  ```
* **响应 (201 Created)**：

  ```json
  {
    "id": "...",
    "caseListId": "...",
    "modelName": "GPT-4",
    "testResult": "结果文本",
    "passed": false,
    "reason": "输出错误原因",
    "testTime": "2025-05-11T10:15:00Z",
    "traceId": "xyz789"
  }
  ```

### DELETE `/api/prompt/case/test?id=...`

* **功能**：删除指定测试明细。
* **URL 参数**：

    * `id` (string)
* **响应**：

  ```json
  { "success": true }
  ```
# ===========================================
# Prompt Case List Endpoints
# ===========================================

### Prompt Case List Endpoints

#### 列表 (按 content_id)
```bash
curl -i -X GET "http://localhost:3000/api/prompt/case/list?content_id=uuid-content-111" \
     -b cookie.txt
```

#### 单条 (按 id)
```bash
curl -i -X GET "http://localhost:3000/api/prompt/case/list?id=uuid-caseList-2222" \
     -b cookie.txt
```

#### 创建
```bash
curl -i -X POST "http://localhost:3000/api/prompt/case/list" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"case_content_id":"uuid-content-111","seq":1,"case_text":"示例用例文本","ground_truth":"正确答案"}'
```

#### 更新 (PUT)
```bash
curl -i -X PUT "http://localhost:3000/api/prompt/case/list" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"id":"uuid-caseList-2222","seq":2,"case_text":"更新后的文本","ground_truth":"更新后的答案"}'
```

#### 删除
```bash
curl -i -X DELETE "http://localhost:3000/api/prompt/case/list?id=uuid-caseList-2222" \
     -b cookie.txt
```

#### 排序 (PATCH)
```bash
curl -i -X PATCH "http://localhost:3000/api/prompt/case/list" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"content_id":"uuid-content-111","ordered_ids":["uuid-caseList-2222","uuid-caseList-3333","uuid-caseList-1111"]}'
```

### Prompt Case Image Endpoints

#### 列出图片
```bash
curl -i -X GET "http://localhost:3000/api/prompt/case/list/uuid-caseList-2222/image" \
     -b cookie.txt
```

#### 添加图片
```bash
curl -i -X POST "http://localhost:3000/api/prompt/case/list/uuid-caseList-2222/image" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com/img.png","position":1}'
```

#### 删除图片
```bash
curl -i -X DELETE "http://localhost:3000/api/prompt/case/list/image/uuid-img-333" \
     -b cookie.txt
```

### Prompt Test Detail Endpoints

#### 列表 (按 case_list_id)
```bash
curl -i -X GET "http://localhost:3000/api/prompt/case/test?case_list_id=uuid-caseList-2222" \
     -b cookie.txt
```

#### 新增测试明细
```bash
curl -i -X POST "http://localhost:3000/api/prompt/case/test" \
     -b cookie.txt \
     -H "Content-Type: application/json" \
     -d '{"case_list_id":"uuid-caseList-2222","model_name":"GPT-4","test_result":"输出内容","passed":false,"reason":"输出错误原因","trace_id":"trace-1234"}'
```

#### 删除测试明细
```bash
curl -i -X DELETE "http://localhost:3000/api/prompt/case/test?id=uuid-test-4444" \
     -b cookie.txt
```