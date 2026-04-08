import { requestJson } from "./http.js";

function escapeGraphQL(value) {
  return JSON.stringify(value).slice(1, -1);
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function columnMap(item) {
  const map = {};
  for (const column of item.column_values || []) {
    map[column.id] = {
      id: column.id,
      text: column.text ?? "",
      value: parseJson(column.value),
      type: column.type ?? null
    };
  }
  return map;
}

function extractRelationName(column) {
  if (!column) {
    return null;
  }

  if (column.text) {
    return column.text;
  }

  const linkedIds =
    column.value?.linkedPulseIds ||
    column.value?.linked_item_ids ||
    column.value?.item_ids ||
    [];

  return linkedIds.length ? linkedIds.join(", ") : null;
}

function mapItem(item) {
  const columns = columnMap(item);
  return {
    id: String(item.id),
    name: item.name,
    columns,
    client_status: columns.status?.text || null,
    device_model: extractRelationName(columns.board_relation5) || columns.order_id?.text || null,
    repair_type: extractRelationName(columns.board_relation) || columns.status24?.text || null,
    payment_status: columns.payment_status?.text || null,
    current_status: columns.status4?.text || null,
    intercom_id: columns.text_mm087h9p?.text || null,
    intercom_link: columns.link1?.text || null,
    email: columns.text5?.text || null,
    phone: columns.text00?.text || null,
    company: columns.text15?.text || null,
    received: columns.date4?.text || null,
    expected: columns.date36?.text || null,
    quote_amount: columns.dup__of_quote_total?.text || columns.numeric_mkxx7j1t?.text || null,
    tech_notes: columns.lookup_mkshh7sn?.text || columns.lookup_mksh916q?.text || null,
    client_type: columns.status?.text || null
  };
}

export class MondayClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.boardId = config.boardId;
  }

  async graphql(query) {
    return requestJson(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query }),
      timeoutMs: 120000
    });
  }

  async itemsByColumn(columnId, value) {
    const query = `
      query {
        items_by_column_values(
          board_id: ${this.boardId},
          column_id: "${escapeGraphQL(columnId)}",
          column_value: "${escapeGraphQL(String(value))}"
        ) {
          id
          name
          column_values {
            id
            text
            value
            type
          }
        }
      }
    `;

    const payload = await this.graphql(query);
    return (payload.data?.items_by_column_values || []).map(mapItem);
  }

  async findByEmail(email) {
    if (!email) {
      return [];
    }
    return this.itemsByColumn("text5", email);
  }

  async findByIntercomId(conversationId) {
    if (!conversationId) {
      return [];
    }
    return this.itemsByColumn("text_mm087h9p", conversationId);
  }

  async findByName(name) {
    if (!name) {
      return [];
    }

    const query = `
      query {
        boards(ids: [${this.boardId}]) {
          items_page(limit: 10, query_params: {
            rules: [{column_id: "name", compare_value: ["${escapeGraphQL(name)}"]}],
            operator: and
          }) {
            items {
              id
              name
              column_values {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `;

    const payload = await this.graphql(query);
    const items = payload.data?.boards?.[0]?.items_page?.items || [];
    return items.map(mapItem);
  }

  async findByPhone(phone, columnId = "text00") {
    if (!phone) {
      return [];
    }
    return this.itemsByColumn(columnId, phone);
  }

  async getBoardColumns() {
    const query = `
      query {
        boards(ids: [${this.boardId}]) {
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const payload = await this.graphql(query);
    return payload.data?.boards?.[0]?.columns || [];
  }

  async fetchRecentItems({ receivedSince, limit = 250 } = {}) {
    void receivedSince;

    const query = `
      query {
        boards(ids: [${this.boardId}]) {
          items_page(limit: ${Number(limit)}) {
            items {
              id
              name
              column_values {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `;

    const payload = await this.graphql(query);
    const items = payload.data?.boards?.[0]?.items_page?.items || [];
    return items.map(mapItem);
  }

  async createItem({ customerName, customerEmail, clientStatus, paymentStatus, intercomId, intercomLink }) {
    const columnValues = {
      text5: customerEmail,
      text_mm087h9p: String(intercomId),
      link1: intercomLink ? { url: intercomLink, text: intercomLink } : undefined,
      status: clientStatus ? { label: clientStatus } : undefined,
      payment_status: paymentStatus ? { label: paymentStatus } : undefined
    };

    const filtered = Object.fromEntries(
      Object.entries(columnValues).filter(([, value]) => value !== undefined && value !== null)
    );

    const query = `
      mutation {
        create_item(
          board_id: ${this.boardId},
          item_name: "${escapeGraphQL(customerName || customerEmail || `Intercom ${intercomId}`)}",
          column_values: "${escapeGraphQL(JSON.stringify(filtered))}"
        ) {
          id
        }
      }
    `;

    const payload = await this.graphql(query);
    return payload.data?.create_item?.id ? String(payload.data.create_item.id) : null;
  }

  async addUpdate(itemId, body) {
    const query = `
      mutation {
        create_update(
          item_id: ${Number(itemId)},
          body: "${escapeGraphQL(body)}"
        ) {
          id
        }
      }
    `;

    const payload = await this.graphql(query);
    return payload.data?.create_update?.id ? String(payload.data.create_update.id) : null;
  }
}

