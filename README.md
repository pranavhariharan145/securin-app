## 🍽 Recipe API - Recipe Retrieval Endpoint

This document outlines the usage for the primary recipe retrieval endpoint, which uses server-side pagination to manage and deliver large datasets efficiently.

---

## 🚀 Endpoint Usage

### `GET /recipes`

Retrieves a paginated list of recipes.

### ⚙️ Request Parameters (Query)

The endpoint accepts the following optional query parameters for controlling the result set. Note that the **limit is strictly capped at 10**.

| Parameter | Type | Default Value | Maximum Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`page`** | `integer` | `1` | N/A | The page number of results to retrieve (must be $\ge 1$). |
| **`limit`** | `integer` | `10` | **`10`** | The maximum number of results to include per page. **Any value above 10 will be capped at 10.** |

### 💡 Example Requests

| Description | Request URL |
| :--- | :--- |
| Default Request (Page 1, Limit 10) | `/recipes` |
| Requesting the third page, default limit | `/recipes?page=3` |
| Requesting 5 items per page | `/recipes?page=1&limit=5` |
| Capped Request (Limit will be enforced as 10) | `/recipes?limit=50` |

---

## 💬 Response Structure

The endpoint returns a JSON object containing the pagination metadata and the array of data.

### Success Response (`HTTP 200 OK`)

| Field | Type | Description |
| :--- | :--- | :--- |
| **`page`** | `integer` | The current page number returned. |
| **`limit`** | `integer` | The actual maximum number of items per page used for the query (will be $\le 10$). |
| **`count`** | `integer` | The number of items actually returned in the current page's `data` array ($\le limit$). |
| **`data`** | `array` | An array of recipe objects. |

### Example Response Body

```json
{
  "page": 1,
  "limit": 10,
  "count": 10,
  "data": [
    {
      "id": 8451,
      "title": "Cherry Amish Friendship Bread Cupcakes with Buttercream Frosting",
      "cuisine": "Amish and Mennonite Recipes",
      "rating": 4,
      "total_time": 70,
      "calories": "366 kcal"
    },
    // ... remaining recipe objects ...
  ]
}
