import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export default async function handler(req, res) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DB_PALLETS,
    });

    const pallets = response.results.map((item: any) => ({
      id: item.properties["ID PALLET"]?.title?.[0]?.plain_text || "",
      code: item.properties["Codice"]?.rich_text?.[0]?.plain_text || "",
      description: item.properties["Descrizione"]?.rich_text?.[0]?.plain_text || "",
      lot: item.properties["Lotto"]?.rich_text?.[0]?.plain_text || "",
      client: item.properties["Cliente"]?.select?.name || "",
      supplier: item.properties["Fornitore"]?.select?.name || "",
      qtyInitial: item.properties["Qta iniziale"]?.number || 0,
      qtyResidual: item.properties["Qta residua"]?.number || 0,
      uom: item.properties["UM"]?.select?.name || "",
      position: item.properties["Posizione"]?.rich_text?.[0]?.plain_text || "",
      status: item.properties["Stato"]?.select?.name || "",
      createdAt: item.properties["Data creazione"]?.date?.start || "",
    }));

    res.status(200).json(pallets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}