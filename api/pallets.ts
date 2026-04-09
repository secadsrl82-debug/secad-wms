import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

function getTitleValue(properties: Record<string, any>) {
  const titleProp = Object.values(properties).find((prop: any) => prop?.type === "title");
  return titleProp?.title?.[0]?.plain_text || "";
}

function getRichText(properties: Record<string, any>, name: string) {
  const prop = properties[name];
  if (!prop) return "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  return "";
}

function getSelect(properties: Record<string, any>, name: string) {
  const prop = properties[name];
  if (!prop) return "";
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  return "";
}

function getNumber(properties: Record<string, any>, name: string) {
  const prop = properties[name];
  if (!prop) return 0;
  return prop.type === "number" ? prop.number || 0 : 0;
}

function getDateValue(properties: Record<string, any>, name: string) {
  const prop = properties[name];
  if (!prop) return "";
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "created_time") return prop.created_time || "";
  return "";
}

export default async function handler(req, res) {
  try {
    const database = await notion.databases.retrieve({
      database_id: process.env.NOTION_DB_PALLETS!,
    });

    const dataSourceId = (database as any).data_sources?.[0]?.id;

    if (!dataSourceId) {
      return res.status(500).json({
        error: "Nessun data source trovato dentro il database Notion.",
      });
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });

    const pallets = response.results.map((item: any) => {
      const props = item.properties || {};

      return {
        id: getTitleValue(props),
        code: getRichText(props, "Codice"),
        description: getRichText(props, "Descrizione"),
        lot: getRichText(props, "Lotto"),
        client: getSelect(props, "Cliente"),
        supplier: getSelect(props, "Fornitore"),
        qtyInitial: getNumber(props, "Qta iniziale"),
        qtyResidual: getNumber(props, "Qta residua"),
        uom: getSelect(props, "UM"),
        position: getRichText(props, "Posizione"),
        status: getSelect(props, "Stato"),
        createdAt: getDateValue(props, "Data creazione"),
      };
    });

    return res.status(200).json(pallets);
  } catch (error: any) {
    console.error("Errore Notion pallets:", error);
    return res.status(500).json({
      error: error?.message || "Errore sconosciuto su Notion",
    });
  }
}