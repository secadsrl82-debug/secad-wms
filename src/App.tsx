import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, ArrowDownToLine, ArrowUpFromLine, RotateCcw, Warehouse, Filter } from "lucide-react";

type ArticleDef = {
  desc: string;
  uoms: string[];
  conversions?: {
    KG_to_MQ?: number;
    MQ_to_M?: number;
    KG_to_M?: number;
  };
};

const initialArticleCatalog: Record<string, ArticleDef> = {
  MPSL00001: { desc: "65 GSM, CARTA GLASSINE MONOSILICONATA, BIANCA, 770 MM", uoms: ["KG", "MQ", "M"], conversions: { KG_to_MQ: 18, MQ_to_M: 1.3, KG_to_M: 23.4 } },
  MPLA00008: { desc: "KOSMEO, CERA", uoms: ["KG"] },
  MPPA00001: { desc: "BELSIL DM 12.500", uoms: ["KG", "L"] },
  MPSA00001: { desc: "Adesivo Secad", uoms: ["KG", "MQ"], conversions: { KG_to_MQ: 9.5 } },
  MPLF00003: { desc: "Frontale Cliente", uoms: ["MQ", "M"], conversions: { MQ_to_M: 1.5 } },
};

const initialSuppliers = ["SECAD", "BASF", "KOSMEO", "FORNITORE_A", "FORNITORE_B"];
const positions = ["A-01-01", "A-01-02", "L-01-01", "F-01-01", "P-01-01", "I-01-01", "U-01-01"];
const initialClients = ["SECAD", "KOSMEO", "CLIENTE_A", "CLIENTE_B"];

type Pallet = {
  id: string;
  code: string;
  description: string;
  type: string;
  family: string;
  lot: string;
  client: string;
  supplier: string;
  qtyInitial: number;
  qtyResidual: number;
  uom: string;
  position: string;
  status: string;
  origin: string;
  createdAt: string;
};

type Movement = {
  at: string;
  type: string;
  palletId: string;
  code: string;
  lot: string;
  qty: number;
  uom: string;
  destination: string;
  note: string;
};

type ProductionItem = {
  id: string;
  sourcePalletId: string;
  code: string;
  lot: string;
  client: string;
  supplier: string;
  qty: number;
  uom: string;
  fromPosition: string;
  movedAt: string;
  note: string;
};

function parseArticle(code: string, catalog: Record<string, ArticleDef> = initialArticleCatalog) {
  if (!code || code.length < 4) {
    return { type: "", family: "", description: "", uoms: ["KG"] };
  }

  const prefix = code.slice(0, 3);
  const familyCode = code.slice(3, 4);
  const typeMap: Record<string, string> = { MPS: "SECAD", MPL: "CLIENTE", MPP: "PROVE" };
  const familyMap: Record<string, string> = {
    A: "ADESIVO",
    L: "LINER",
    F: "FRONTALE",
    U: "UTILITA",
    I: "IMBALLO",
  };
  const art = catalog[code];

  return {
    type: typeMap[prefix] || "ALTRO",
    family: familyMap[familyCode] || "ALTRO",
    description: art?.desc || "Articolo non presente in anagrafica demo",
    uoms: art?.uoms || ["KG"],
  };
}

function nextPalletId(items: Pallet[]) {
  const max = items.reduce((acc, item) => {
    const n = Number(String(item.id || "").replace("P", ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `P${String(max + 1).padStart(6, "0")}`;
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseQty(value: string | number) {
  const normalized = String(value ?? "")
    .replace(",", ".")
    .trim();
  const qty = Number(normalized);
  return Number.isFinite(qty) ? qty : NaN;
}

const initialPallets: Pallet[] = [
  {
    id: "P000001",
    code: "MPLA00008",
    description: initialArticleCatalog.MPLA00008.desc,
    type: "CLIENTE",
    family: "ADESIVO",
    lot: "LOT-KOS-250407",
    client: "KOSMEO",
    supplier: "KOSMEO",
    qtyInitial: 180,
    qtyResidual: 120,
    uom: "KG",
    position: "A-01-02",
    status: "A MAGAZZINO",
    origin: "FORNITORE",
    createdAt: "2026-04-07 10:15",
  },
  {
    id: "P000002",
    code: "MPSL00001",
    description: initialArticleCatalog.MPSL00001.desc,
    type: "SECAD",
    family: "LINER",
    lot: "LOT-SEC-250407",
    client: "SECAD",
    supplier: "BASF",
    qtyInitial: 500,
    qtyResidual: 500,
    uom: "KG",
    position: "L-01-01",
    status: "A MAGAZZINO",
    origin: "FORNITORE",
    createdAt: "2026-04-07 10:30",
  },
];

const initialMovements: Movement[] = [
  {
    at: "2026-04-07 10:15",
    type: "CARICO",
    palletId: "P000001",
    code: "MPLA00008",
    lot: "LOT-KOS-250407",
    qty: 180,
    uom: "KG",
    destination: "MAGAZZINO",
    note: "Carico iniziale",
  },
  {
    at: "2026-04-07 10:30",
    type: "CARICO",
    palletId: "P000002",
    code: "MPSL00001",
    lot: "LOT-SEC-250407",
    qty: 500,
    uom: "KG",
    destination: "MAGAZZINO",
    note: "Carico iniziale",
  },
];

export default function MiniWmsSecadApp() {
  const [uiMessage, setUiMessage] = useState("");
  const [articleCatalog, setArticleCatalog] = useState<Record<string, ArticleDef>>(initialArticleCatalog);
  const [suppliers, setSuppliers] = useState<string[]>(initialSuppliers);
  const [clients, setClients] = useState<string[]>(initialClients);
  const [newSupplier, setNewSupplier] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [newClient, setNewClient] = useState("");
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [newArticle, setNewArticle] = useState({ code: "", desc: "", uoms: "KG", kgToMq: "", mqToM: "", kgToM: "" });
  const [editingArticleCode, setEditingArticleCode] = useState<string | null>(null);
  const [pallets, setPallets] = useState<Pallet[]>(initialPallets);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);

  const [loadForm, setLoadForm] = useState({
    code: "",
    lot: "",
    client: "",
    supplier: "SECAD",
    qty: "",
    uom: "KG",
    position: "",
    note: "",
  });

  const [pickSearch, setPickSearch] = useState({ code: "", client: "", lot: "" });
  const [pickForm, setPickForm] = useState({ palletId: "", qty: "", destination: "PRODUZIONE", note: "" });

  const [returnSearch, setReturnSearch] = useState({ code: "", client: "", lot: "" });
  const [returnForm, setReturnForm] = useState({
    mode: "same_pallet",
    productionItemId: "",
    code: "",
    lot: "",
    client: "",
    qty: "",
    uom: "KG",
    position: "",
    status: "A MAGAZZINO",
    note: "",
  });

  const [searchForm, setSearchForm] = useState({ code: "", supplier: "", lot: "", client: "" });

  const loadMeta = parseArticle(loadForm.code, articleCatalog);
  const canCreatePallet = Boolean(
    loadForm.code &&
    loadForm.lot &&
    loadForm.position &&
    parseQty(loadForm.qty) > 0 &&
    (loadMeta.type !== "CLIENTE" || loadForm.client)
  );
  const nextLoadPalletId = nextPalletId(pallets);

  const availablePallets = useMemo(() => {
    return pallets.filter((p) => {
      const matchesCode = !pickSearch.code || p.code.toLowerCase().includes(pickSearch.code.toLowerCase());
      const matchesClient = !pickSearch.client || p.client === pickSearch.client;
      const matchesLot = !pickSearch.lot || p.lot.toLowerCase().includes(pickSearch.lot.toLowerCase());
      return matchesCode && matchesClient && matchesLot && p.qtyResidual > 0;
    });
  }, [pallets, pickSearch]);

  const searchResults = useMemo(() => {
    return pallets.filter((p) => {
      const matchesCode = !searchForm.code || p.code.toLowerCase().includes(searchForm.code.toLowerCase());
      const matchesSupplier = !searchForm.supplier || p.supplier === searchForm.supplier;
      const matchesLot = !searchForm.lot || p.lot.toLowerCase().includes(searchForm.lot.toLowerCase());
      const matchesClient = !searchForm.client || p.client === searchForm.client;
      return matchesCode && matchesSupplier && matchesLot && matchesClient;
    });
  }, [pallets, searchForm]);

  const selectedPickPallet = pallets.find((p) => p.id === pickForm.palletId);

  const availableProductionItems = useMemo(() => {
    return productionItems.filter((p) => {
      const matchesCode = !returnSearch.code || p.code.toLowerCase().includes(returnSearch.code.toLowerCase());
      const matchesClient = !returnSearch.client || p.client === returnSearch.client;
      const matchesLot = !returnSearch.lot || p.lot.toLowerCase().includes(returnSearch.lot.toLowerCase());
      return matchesCode && matchesClient && matchesLot;
    });
  }, [productionItems, returnSearch]);

  const selectedReturnItem = productionItems.find((p) => p.id === returnForm.productionItemId);
  const returnMeta = parseArticle(returnForm.code || selectedReturnItem?.code || "", articleCatalog);

  const kpis = {
    active: pallets.filter((p) => p.qtyResidual > 0).length,
    blocked: pallets.filter((p) => p.status === "BLOCCATO").length,
    inProduction: productionItems.length,
    customer: pallets.filter((p) => p.type === "CLIENTE" && p.qtyResidual > 0).length,
    lab: pallets.filter((p) => p.type === "PROVE" && p.qtyResidual > 0).length,
  };

  const articleCodes = Object.keys(articleCatalog);

  function addSupplier() {
    const value = newSupplier.trim();
    if (!value) return;

    if (editingSupplier) {
      if (suppliers.includes(value) && value !== editingSupplier) {
        setUiMessage("Esiste già un fornitore con questo nome.");
        return;
      }
      setSuppliers((prev) => prev.map((s) => (s === editingSupplier ? value : s)));
      setPallets((prev) => prev.map((p) => (p.supplier === editingSupplier ? { ...p, supplier: value } : p)));
      setProductionItems((prev) => prev.map((p) => (p.supplier === editingSupplier ? { ...p, supplier: value } : p)));
      setUiMessage(`Fornitore ${editingSupplier} modificato in ${value}.`);
      setEditingSupplier(null);
      setNewSupplier("");
      return;
    }

    if (suppliers.includes(value)) {
      setUiMessage("Fornitore già presente.");
      return;
    }
    setSuppliers((prev) => [...prev, value]);
    setNewSupplier("");
    setUiMessage(`Fornitore ${value} aggiunto.`);
  }

  function editSupplier(name: string) {
    setEditingSupplier(name);
    setNewSupplier(name);
  }

  function deleteSupplier(name: string) {
    const used = pallets.some((p) => p.supplier === name) || productionItems.some((p) => p.supplier === name);
    if (used) {
      setUiMessage(`Il fornitore ${name} è usato nel sistema e non può essere eliminato.`);
      return;
    }
    setSuppliers((prev) => prev.filter((s) => s !== name));
    if (editingSupplier === name) {
      setEditingSupplier(null);
      setNewSupplier("");
    }
    setUiMessage(`Fornitore ${name} eliminato.`);
  }

  function addClient() {
    const value = newClient.trim();
    if (!value) return;

    if (editingClient) {
      if (clients.includes(value) && value !== editingClient) {
        setUiMessage("Esiste già un cliente con questo nome.");
        return;
      }
      setClients((prev) => prev.map((c) => (c === editingClient ? value : c)));
      setPallets((prev) => prev.map((p) => (p.client === editingClient ? { ...p, client: value } : p)));
      setProductionItems((prev) => prev.map((p) => (p.client === editingClient ? { ...p, client: value } : p)));
      setUiMessage(`Cliente ${editingClient} modificato in ${value}.`);
      setEditingClient(null);
      setNewClient("");
      return;
    }

    if (clients.includes(value)) {
      setUiMessage("Cliente già presente.");
      return;
    }
    setClients((prev) => [...prev, value]);
    setNewClient("");
    setUiMessage(`Cliente ${value} aggiunto.`);
  }

  function editClient(name: string) {
    setEditingClient(name);
    setNewClient(name);
  }

  function deleteClient(name: string) {
    const used = pallets.some((p) => p.client === name) || productionItems.some((p) => p.client === name);
    if (used) {
      setUiMessage(`Il cliente ${name} è usato nel sistema e non può essere eliminato.`);
      return;
    }
    setClients((prev) => prev.filter((c) => c !== name));
    if (editingClient === name) {
      setEditingClient(null);
      setNewClient("");
    }
    setUiMessage(`Cliente ${name} eliminato.`);
  }

  function addArticle() {
    const code = newArticle.code.trim().toUpperCase();
    const desc = newArticle.desc.trim();
    const uoms = newArticle.uoms.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
    if (!code || !desc || uoms.length === 0) {
      setUiMessage("Per aggiungere un articolo compila codice, descrizione e almeno una UM.");
      return;
    }
    if (articleCatalog[code] && editingArticleCode !== code) {
      setUiMessage("Codice articolo già presente.");
      return;
    }
    const conversions: ArticleDef["conversions"] = {};
    const kgToMq = parseQty(newArticle.kgToMq);
    const mqToM = parseQty(newArticle.mqToM);
    const kgToM = parseQty(newArticle.kgToM);
    if (Number.isFinite(kgToMq)) conversions.KG_to_MQ = kgToMq;
    if (Number.isFinite(mqToM)) conversions.MQ_to_M = mqToM;
    if (Number.isFinite(kgToM)) conversions.KG_to_M = kgToM;

    setArticleCatalog((prev) => ({
      ...prev,
      [code]: { desc, uoms, conversions: Object.keys(conversions).length ? conversions : undefined },
    }));

    setPallets((prev) => prev.map((p) => (p.code === code ? { ...p, description: desc } : p)));

    setNewArticle({ code: "", desc: "", uoms: "KG", kgToMq: "", mqToM: "", kgToM: "" });
    if (editingArticleCode) {
      setUiMessage(`Articolo ${code} modificato.`);
      setEditingArticleCode(null);
    } else {
      setUiMessage(`Articolo ${code} aggiunto in anagrafica.`);
    }
  }

  function loadArticleForEdit(code: string) {
    const article = articleCatalog[code];
    if (!article) return;
    setEditingArticleCode(code);
    setNewArticle({
      code,
      desc: article.desc,
      uoms: article.uoms.join(","),
      kgToMq: article.conversions?.KG_to_MQ != null ? String(article.conversions.KG_to_MQ) : "",
      mqToM: article.conversions?.MQ_to_M != null ? String(article.conversions.MQ_to_M) : "",
      kgToM: article.conversions?.KG_to_M != null ? String(article.conversions.KG_to_M) : "",
    });
  }

  function deleteArticle(code: string) {
    const used = pallets.some((p) => p.code === code) || productionItems.some((p) => p.code === code) || movements.some((m) => m.code === code);
    if (used) {
      setUiMessage(`L'articolo ${code} è usato nel sistema e non può essere eliminato.`);
      return;
    }
    setArticleCatalog((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
    if (editingArticleCode === code) {
      setEditingArticleCode(null);
      setNewArticle({ code: "", desc: "", uoms: "KG", kgToMq: "", mqToM: "", kgToM: "" });
    }
    setUiMessage(`Articolo ${code} eliminato.`);
  }

  function cancelArticleEdit() {
    setEditingArticleCode(null);
    setNewArticle({ code: "", desc: "", uoms: "KG", kgToMq: "", mqToM: "", kgToM: "" });
  }

  const qaChecks = [
    { name: "parseQty 400", ok: parseQty("400") === 400 },
    { name: "parseQty 101", ok: parseQty("101") === 101 },
    { name: "parseQty 10,5", ok: parseQty("10,5") === 10.5 },
    { name: "anagrafica presente", ok: articleCodes.length > 0 },
    { name: "nextPalletId", ok: nextPalletId([{ id: "P000009" } as Pallet]) === "P000010" },
  ];

  function handleCreatePallet() {
    const type = loadMeta.type;
    const qty = parseQty(loadForm.qty);

    if (!loadForm.code || !loadForm.lot || !loadForm.qty || !loadForm.position) {
      setUiMessage("Compila codice, lotto, quantità e posizione.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setUiMessage("La quantità deve essere maggiore di zero.");
      return;
    }
    if (type === "CLIENTE" && !loadForm.client) {
      setUiMessage("Per i codici MPL devi selezionare il cliente.");
      return;
    }

    const id = nextPalletId(pallets);
    const client = type === "CLIENTE" ? loadForm.client : "SECAD";
    const supplier = loadForm.supplier || (type === "CLIENTE" ? loadForm.client : "SECAD");

    const newPallet: Pallet = {
      id,
      code: loadForm.code,
      description: loadMeta.description,
      type,
      family: loadMeta.family,
      lot: loadForm.lot,
      client,
      supplier,
      qtyInitial: qty,
      qtyResidual: qty,
      uom: loadForm.uom,
      position: loadForm.position,
      status: "A MAGAZZINO",
      origin: "FORNITORE",
      createdAt: nowStamp(),
    };

    setPallets((prev) => [newPallet, ...prev]);
    setMovements((prev) => [
      {
        at: nowStamp(),
        type: "CARICO",
        palletId: id,
        code: loadForm.code,
        lot: loadForm.lot,
        qty,
        uom: loadForm.uom,
        destination: "MAGAZZINO",
        note: loadForm.note || "Carico",
      },
      ...prev,
    ]);

    setLoadForm({ code: "", lot: "", client: "", supplier: "SECAD", qty: "", uom: "KG", position: "", note: "" });
    setUiMessage(`Pallet ${id} creato correttamente.`);
  }

  function handlePrelievo() {
    if (!selectedPickPallet || !pickForm.qty) {
      setUiMessage("Seleziona un pallet e inserisci la quantità da prelevare.");
      return;
    }

    const qty = parseQty(pickForm.qty);
    if (!Number.isFinite(qty) || qty <= 0 || qty > selectedPickPallet.qtyResidual) {
      setUiMessage("La quantità di prelievo non è valida.");
      return;
    }

    setPallets((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPickPallet.id) return p;
        const residual = p.qtyResidual - qty;
        return {
          ...p,
          qtyResidual: residual,
          status: residual === 0 ? "ESAURITO" : "A MAGAZZINO",
        };
      })
    );

    if (pickForm.destination === "PRODUZIONE") {
      const newProd: ProductionItem = {
        id: `PRD-${Date.now()}`,
        sourcePalletId: selectedPickPallet.id,
        code: selectedPickPallet.code,
        lot: selectedPickPallet.lot,
        client: selectedPickPallet.client,
        supplier: selectedPickPallet.supplier,
        qty,
        uom: selectedPickPallet.uom,
        fromPosition: selectedPickPallet.position,
        movedAt: nowStamp(),
        note: pickForm.note || "Prelievo a produzione",
      };
      setProductionItems((prev) => [newProd, ...prev]);
    }

    setMovements((prev) => [
      {
        at: nowStamp(),
        type: "PRELIEVO",
        palletId: selectedPickPallet.id,
        code: selectedPickPallet.code,
        lot: selectedPickPallet.lot,
        qty,
        uom: selectedPickPallet.uom,
        destination: pickForm.destination,
        note: pickForm.note || "Prelievo",
      },
      ...prev,
    ]);

    setPickForm({ palletId: "", qty: "", destination: "PRODUZIONE", note: "" });
    setUiMessage(`Prelievo registrato sul pallet ${selectedPickPallet.id}.`);
  }

  function handleRientro() {
    const sourceItem = selectedReturnItem;
    const code = sourceItem?.code || returnForm.code;
    const lot = sourceItem?.lot || returnForm.lot;
    const sourceClient = sourceItem?.client || returnForm.client;
    const sourceUom = sourceItem?.uom || returnForm.uom;
    const meta = parseArticle(code, articleCatalog);
    const type = meta.type;
    const family = meta.family;
    const description = meta.description;
    const qty = parseQty(returnForm.qty);

    if (!sourceItem && (!returnForm.code || !returnForm.lot)) {
      setUiMessage("Seleziona un articolo in produzione oppure compila codice e lotto.");
      return;
    }
    if (!returnForm.qty || !returnForm.position) {
      setUiMessage("Compila quantità e posizione del rientro.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setUiMessage("La quantità del rientro deve essere maggiore di zero.");
      return;
    }
    if (sourceItem && qty > sourceItem.qty) {
      setUiMessage("La quantità di rientro non può superare la quantità in produzione.");
      return;
    }
    if (type === "CLIENTE" && !sourceClient) {
      setUiMessage("Per i codici MPL devi recuperare il cliente nel rientro.");
      return;
    }

    const client = type === "CLIENTE" ? sourceClient : "SECAD";

    if (returnForm.mode === "same_pallet" && sourceItem?.sourcePalletId) {
      setPallets((prev) =>
        prev.map((p) => {
          if (p.id !== sourceItem.sourcePalletId) return p;
          return {
            ...p,
            qtyResidual: p.qtyResidual + qty,
            position: returnForm.position || p.position,
            status: returnForm.status,
          };
        })
      );

      setMovements((prev) => [
        {
          at: nowStamp(),
          type: "RIENTRO PRODUZIONE",
          palletId: sourceItem.sourcePalletId,
          code,
          lot,
          qty,
          uom: sourceUom,
          destination: "MAGAZZINO",
          note: returnForm.note || `Rientro sul pallet esistente ${sourceItem.sourcePalletId}`,
        },
        ...prev,
      ]);

      setProductionItems((prev) =>
        prev.flatMap((p) => {
          if (p.id !== sourceItem.id) return [p];
          const residual = p.qty - qty;
          if (residual <= 0) return [];
          return [{ ...p, qty: residual }];
        })
      );

      setReturnForm({ mode: "same_pallet", productionItemId: "", code: "", lot: "", client: "", qty: "", uom: "KG", position: "", status: "A MAGAZZINO", note: "" });
      setUiMessage(`Quantità rientrata sul pallet esistente ${sourceItem.sourcePalletId}. Nessuna nuova etichetta necessaria.`);
      return;
    }

    const id = nextPalletId(pallets);
    const newPallet: Pallet = {
      id,
      code,
      description,
      type,
      family,
      lot,
      client,
      supplier: sourceItem?.supplier || (type === "CLIENTE" ? sourceClient : "SECAD"),
      qtyInitial: qty,
      qtyResidual: qty,
      uom: sourceUom,
      position: returnForm.position,
      status: returnForm.status,
      origin: "PRODUZIONE",
      createdAt: nowStamp(),
    };

    setPallets((prev) => [newPallet, ...prev]);
    setMovements((prev) => [
      {
        at: nowStamp(),
        type: "RIENTRO PRODUZIONE",
        palletId: id,
        code,
        lot,
        qty,
        uom: sourceUom,
        destination: "MAGAZZINO",
        note: returnForm.note || `Rientro da ${sourceItem?.id || "manuale"}`,
      },
      ...prev,
    ]);

    if (sourceItem) {
      setProductionItems((prev) =>
        prev.flatMap((p) => {
          if (p.id !== sourceItem.id) return [p];
          const residual = p.qty - qty;
          if (residual <= 0) return [];
          return [{ ...p, qty: residual }];
        })
      );
    }

    setReturnForm({ mode: "same_pallet", productionItemId: "", code: "", lot: "", client: "", qty: "", uom: "KG", position: "", status: "A MAGAZZINO", note: "" });
    setUiMessage(`Nuovo pallet di rientro ${id} creato correttamente.`);
  }

  function handleConsumeProduction(id: string) {
    const item = productionItems.find((p) => p.id === id);
    if (!item) {
      setUiMessage("Articolo in produzione non trovato.");
      return;
    }

    setProductionItems((prev) => prev.filter((p) => p.id !== id));
    setMovements((prev) => [
      {
        at: nowStamp(),
        type: "CONSUMO PRODUZIONE",
        palletId: item.sourcePalletId,
        code: item.code,
        lot: item.lot,
        qty: item.qty,
        uom: item.uom,
        destination: "PRODUZIONE",
        note: `Consumato da produzione (${item.id})`,
      },
      ...prev,
    ]);
    setUiMessage(`Articolo ${id} segnato come consumato.`);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mini WMS Secad</h1>
            <p className="mt-1 text-sm text-slate-600">App demo per carico, prelievo, rientro e produzione.</p>
          </div>
          <Badge className="rounded-2xl px-3 py-1 text-sm">Demo operativa</Badge>
        </div>

        {uiMessage ? (
          <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{uiMessage}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="text-sm text-slate-500">Pallet attivi</div><div className="mt-2 text-3xl font-bold">{kpis.active}</div></CardContent></Card>
          <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="text-sm text-slate-500">Pallet bloccati</div><div className="mt-2 text-3xl font-bold">{kpis.blocked}</div></CardContent></Card>
          <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="text-sm text-slate-500">In produzione</div><div className="mt-2 text-3xl font-bold">{kpis.inProduction}</div></CardContent></Card>
          <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="text-sm text-slate-500">Materiale cliente</div><div className="mt-2 text-3xl font-bold">{kpis.customer}</div></CardContent></Card>
          <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="text-sm text-slate-500">Materiale prove</div><div className="mt-2 text-3xl font-bold">{kpis.lab}</div></CardContent></Card>
        </div>

        <Tabs defaultValue="carico" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8 rounded-2xl">
            <TabsTrigger value="carico">Carico</TabsTrigger>
            <TabsTrigger value="prelievo">Prelievo</TabsTrigger>
            <TabsTrigger value="rientro">Rientro</TabsTrigger>
            <TabsTrigger value="ricerca">Ricerca</TabsTrigger>
            <TabsTrigger value="pallet">Pallet</TabsTrigger>
            <TabsTrigger value="produzione">Produzione</TabsTrigger>
            <TabsTrigger value="movimenti">Movimenti</TabsTrigger>
            <TabsTrigger value="anagrafiche">Anagrafiche</TabsTrigger>
          </TabsList>

          <TabsContent value="carico">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5" /> Carico pallet</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Codice articolo</Label>
                  <Select
                    value={loadForm.code}
                    onValueChange={(v) => {
                      const meta = parseArticle(v, articleCatalog);
                      setLoadForm((s) => ({
                        ...s,
                        code: v,
                        client: meta.type === "CLIENTE" ? s.client : "SECAD",
                        supplier: meta.type === "CLIENTE" ? s.supplier : "SECAD",
                        uom: meta.uoms[0] || "KG",
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleziona codice" /></SelectTrigger>
                    <SelectContent>
                      {articleCodes.map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Lotto fornitore</Label><Input value={loadForm.lot} onChange={(e) => setLoadForm((s) => ({ ...s, lot: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Quantità</Label><Input inputMode="decimal" value={loadForm.qty} onChange={(e) => setLoadForm((s) => ({ ...s, qty: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Unità di misura</Label>
                  <Select value={loadForm.uom} onValueChange={(v) => setLoadForm((s) => ({ ...s, uom: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleziona UM" /></SelectTrigger>
                    <SelectContent>
                      {loadMeta.uoms.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Posizione</Label>
                  <Select value={loadForm.position} onValueChange={(v) => setLoadForm((s) => ({ ...s, position: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleziona posizione" /></SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Descrizione</Label><Input value={loadMeta.description} readOnly /></div>
                <div className="space-y-2"><Label>Tipo</Label><Input value={loadMeta.type} readOnly /></div>
                <div className="space-y-2"><Label>Famiglia</Label><Input value={loadMeta.family} readOnly /></div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  {loadMeta.type === "CLIENTE" ? (
                    <Select value={loadForm.client} onValueChange={(v) => setLoadForm((s) => ({ ...s, client: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : <Input value="SECAD" readOnly />}
                </div>
                <div className="space-y-2">
                  <Label>Fornitore</Label>
                  <Select value={loadForm.supplier} onValueChange={(v) => setLoadForm((s) => ({ ...s, supplier: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleziona fornitore" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nuovo ID pallet</Label>
                  <Input value={nextLoadPalletId} readOnly />
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-2"><Label>Note</Label><Input value={loadForm.note} onChange={(e) => setLoadForm((s) => ({ ...s, note: e.target.value }))} /></div>
                <div className="lg:col-span-4 space-y-3">
                  <div className="text-sm text-slate-500">
                    {canCreatePallet ? "Tutto pronto: puoi creare il pallet." : "Compila codice, lotto, quantità, posizione e cliente se il codice è MPL."}
                  </div>
                  <Button className="rounded-2xl" onClick={handleCreatePallet} disabled={!canCreatePallet}>Crea pallet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prelievo">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Cerca lotti disponibili</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2"><Label>Codice</Label><Input value={pickSearch.code} onChange={(e) => setPickSearch((s) => ({ ...s, code: e.target.value }))} /></div>
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select value={pickSearch.client || "_all"} onValueChange={(v) => setPickSearch((s) => ({ ...s, client: v === "_all" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Tutti" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">Tutti</SelectItem>
                          {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Lotto</Label><Input value={pickSearch.lot} onChange={(e) => setPickSearch((s) => ({ ...s, lot: e.target.value }))} /></div>
                  </div>
                  <div className="rounded-2xl border bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Codice</TableHead>
                          <TableHead>Lotto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fornitore</TableHead>
                          <TableHead>Residuo</TableHead>
                          <TableHead>Posizione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availablePallets.map((p) => (
                          <TableRow key={p.id} className="cursor-pointer" onClick={() => setPickForm((s) => ({ ...s, palletId: p.id }))}>
                            <TableCell className="font-medium">{p.id}</TableCell>
                            <TableCell>{p.code}</TableCell>
                            <TableCell>{p.lot}</TableCell>
                            <TableCell>{p.client}</TableCell>
                            <TableCell>{p.supplier}</TableCell>
                            <TableCell>{p.qtyResidual} {p.uom}</TableCell>
                            <TableCell>{p.position}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpFromLine className="h-5 w-5" /> Registra prelievo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>ID pallet scelto</Label><Input value={pickForm.palletId} onChange={(e) => setPickForm((s) => ({ ...s, palletId: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Lotto</Label><Input value={selectedPickPallet?.lot || ""} readOnly /></div>
                  <div className="space-y-2"><Label>Quantità residua</Label><Input value={selectedPickPallet ? `${selectedPickPallet.qtyResidual} ${selectedPickPallet.uom}` : ""} readOnly /></div>
                  <div className="space-y-2"><Label>Posizione</Label><Input value={selectedPickPallet?.position || ""} readOnly /></div>
                  <div className="space-y-2"><Label>Quantità da prelevare</Label><Input inputMode="decimal" value={pickForm.qty} onChange={(e) => setPickForm((s) => ({ ...s, qty: e.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label>Destinazione</Label>
                    <Select value={pickForm.destination} onValueChange={(v) => setPickForm((s) => ({ ...s, destination: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUZIONE">PRODUZIONE</SelectItem>
                        <SelectItem value="SPEDIZIONE">SPEDIZIONE</SelectItem>
                        <SelectItem value="LABORATORIO">LABORATORIO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Note</Label><Input value={pickForm.note} onChange={(e) => setPickForm((s) => ({ ...s, note: e.target.value }))} /></div>
                  <Button className="rounded-2xl" onClick={handlePrelievo}>Preleva</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rientro">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" /> Seleziona materiale in produzione</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2"><Label>Codice</Label><Input value={returnSearch.code} onChange={(e) => setReturnSearch((s) => ({ ...s, code: e.target.value }))} /></div>
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select value={returnSearch.client || "_all"} onValueChange={(v) => setReturnSearch((s) => ({ ...s, client: v === "_all" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Tutti" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">Tutti</SelectItem>
                          {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Lotto</Label><Input value={returnSearch.lot} onChange={(e) => setReturnSearch((s) => ({ ...s, lot: e.target.value }))} /></div>
                  </div>

                  <div className="rounded-2xl border bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID produzione</TableHead>
                          <TableHead>Pallet origine</TableHead>
                          <TableHead>Codice</TableHead>
                          <TableHead>Lotto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Qta in produzione</TableHead>
                          <TableHead>Posizione origine</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableProductionItems.map((p) => (
                          <TableRow
                            key={p.id}
                            className="cursor-pointer"
                            onClick={() =>
                              setReturnForm((s) => ({
                                ...s,
                                productionItemId: p.id,
                                code: p.code,
                                lot: p.lot,
                                client: p.client,
                                uom: p.uom,
                                qty: String(p.qty),
                                mode: "same_pallet",
                              }))
                            }
                          >
                            <TableCell className="font-medium">{p.id}</TableCell>
                            <TableCell>{p.sourcePalletId}</TableCell>
                            <TableCell>{p.code}</TableCell>
                            <TableCell>{p.lot}</TableCell>
                            <TableCell>{p.client}</TableCell>
                            <TableCell>{p.qty} {p.uom}</TableCell>
                            <TableCell>{p.fromPosition}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" /> Registra rientro</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>ID produzione scelto</Label><Input value={returnForm.productionItemId} onChange={(e) => setReturnForm((s) => ({ ...s, productionItemId: e.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label>Modalità rientro</Label>
                    <Select value={returnForm.mode} onValueChange={(v) => setReturnForm((s) => ({ ...s, mode: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleziona modalità" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same_pallet">Torna nello stesso pallet</SelectItem>
                        <SelectItem value="new_pallet">Crea nuovo pallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Codice</Label><Input value={selectedReturnItem?.code || returnForm.code} readOnly /></div>
                  <div className="space-y-2"><Label>Lotto</Label><Input value={selectedReturnItem?.lot || returnForm.lot} readOnly /></div>
                  <div className="space-y-2"><Label>Cliente</Label><Input value={selectedReturnItem?.client || returnForm.client || "SECAD"} readOnly /></div>
                  <div className="space-y-2"><Label>Qta in produzione</Label><Input value={selectedReturnItem ? `${selectedReturnItem.qty} ${selectedReturnItem.uom}` : ""} readOnly /></div>
                  <div className="space-y-2"><Label>Pallet origine</Label><Input value={selectedReturnItem?.sourcePalletId || ""} readOnly /></div>
                  <div className="space-y-2"><Label>Quantità da rientrare</Label><Input inputMode="decimal" value={returnForm.qty} onChange={(e) => setReturnForm((s) => ({ ...s, qty: e.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label>Posizione</Label>
                    <Select value={returnForm.position} onValueChange={(v) => setReturnForm((s) => ({ ...s, position: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleziona posizione" /></SelectTrigger>
                      <SelectContent>
                        {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stato rientro</Label>
                    <Select value={returnForm.status} onValueChange={(v) => setReturnForm((s) => ({ ...s, status: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleziona stato" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A MAGAZZINO">A MAGAZZINO</SelectItem>
                        <SelectItem value="BLOCCATO">BLOCCATO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Note</Label><Input value={returnForm.note} onChange={(e) => setReturnForm((s) => ({ ...s, note: e.target.value }))} /></div>
                  <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                    {returnForm.mode === "same_pallet"
                      ? "Il rientro aggiornerà il pallet origine esistente: non serve una nuova etichetta."
                      : "Il rientro creerà un nuovo ID pallet: servirà una nuova etichetta."}
                  </div>
                  <Button className="rounded-2xl" onClick={handleRientro}>
                    {returnForm.mode === "same_pallet" ? "Rientra sul pallet esistente" : "Crea nuovo pallet rientro"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ricerca">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Ricerca pallet</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2"><Label>Codice articolo</Label><Input value={searchForm.code} onChange={(e) => setSearchForm((s) => ({ ...s, code: e.target.value }))} placeholder="Es. MPLA00008" /></div>
                  <div className="space-y-2">
                    <Label>Fornitore</Label>
                    <Select value={searchForm.supplier || "_all"} onValueChange={(v) => setSearchForm((s) => ({ ...s, supplier: v === "_all" ? "" : v }))}>
                      <SelectTrigger><SelectValue placeholder="Tutti" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Tutti</SelectItem>
                        {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={searchForm.client || "_all"} onValueChange={(v) => setSearchForm((s) => ({ ...s, client: v === "_all" ? "" : v }))}>
                      <SelectTrigger><SelectValue placeholder="Tutti" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Tutti</SelectItem>
                        {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Lotto</Label><Input value={searchForm.lot} onChange={(e) => setSearchForm((s) => ({ ...s, lot: e.target.value }))} placeholder="Cerca lotto" /></div>
                </div>
                <div className="rounded-2xl border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Codice</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Fornitore</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Lotto</TableHead>
                        <TableHead>Residuo</TableHead>
                        <TableHead>Posizione</TableHead>
                        <TableHead>Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.id}</TableCell>
                          <TableCell>{p.code}</TableCell>
                          <TableCell>{p.description}</TableCell>
                          <TableCell>{p.supplier}</TableCell>
                          <TableCell>{p.client}</TableCell>
                          <TableCell>{p.lot}</TableCell>
                          <TableCell>{p.qtyResidual} {p.uom}</TableCell>
                          <TableCell>{p.position}</TableCell>
                          <TableCell>{p.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pallet">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" /> Pallet attivi</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-2xl border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Codice</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Lotto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fornitore</TableHead>
                        <TableHead>Residuo</TableHead>
                        <TableHead>Posizione</TableHead>
                        <TableHead>Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pallets.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.id}</TableCell>
                          <TableCell>{p.code}</TableCell>
                          <TableCell>{p.description}</TableCell>
                          <TableCell>{p.lot}</TableCell>
                          <TableCell>{p.client}</TableCell>
                          <TableCell>{p.supplier}</TableCell>
                          <TableCell>{p.qtyResidual} {p.uom}</TableCell>
                          <TableCell>{p.position}</TableCell>
                          <TableCell>{p.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produzione">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Articoli in produzione</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-2xl border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Pallet origine</TableHead>
                        <TableHead>Codice</TableHead>
                        <TableHead>Lotto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Qta in produzione</TableHead>
                        <TableHead>Da posizione</TableHead>
                        <TableHead>Azione</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionItems.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.id}</TableCell>
                          <TableCell>{p.sourcePalletId}</TableCell>
                          <TableCell>{p.code}</TableCell>
                          <TableCell>{p.lot}</TableCell>
                          <TableCell>{p.client}</TableCell>
                          <TableCell>{p.qty} {p.uom}</TableCell>
                          <TableCell>{p.fromPosition}</TableCell>
                          <TableCell><Button variant="secondary" size="sm" onClick={() => handleConsumeProduction(p.id)}>Consuma</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movimenti">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Storico movimenti</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-2xl border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Ora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>ID pallet</TableHead>
                        <TableHead>Codice</TableHead>
                        <TableHead>Lotto</TableHead>
                        <TableHead>Qta</TableHead>
                        <TableHead>UM</TableHead>
                        <TableHead>Destinazione</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((m, idx) => (
                        <TableRow key={`${m.palletId}-${idx}`}>
                          <TableCell>{m.at}</TableCell>
                          <TableCell>{m.type}</TableCell>
                          <TableCell>{m.palletId}</TableCell>
                          <TableCell>{m.code}</TableCell>
                          <TableCell>{m.lot}</TableCell>
                          <TableCell>{m.qty}</TableCell>
                          <TableCell>{m.uom}</TableCell>
                          <TableCell>{m.destination}</TableCell>
                          <TableCell>{m.note}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anagrafiche">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Fornitori</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Nuovo fornitore" />
                    <Button onClick={addSupplier}>{editingSupplier ? "Salva" : "Aggiungi"}</Button>
                    {editingSupplier ? <Button variant="outline" onClick={() => { setEditingSupplier(null); setNewSupplier(""); }}>Annulla</Button> : null}
                  </div>
                  <div className="rounded-2xl border bg-white p-3 space-y-2">
                    {suppliers.map((s) => (
                      <div key={s} className="flex items-center justify-between gap-2 text-sm">
                        <span>{s}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => editSupplier(s)}>Modifica</Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteSupplier(s)}>Elimina</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Clienti</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Nuovo cliente" />
                    <Button onClick={addClient}>{editingClient ? "Salva" : "Aggiungi"}</Button>
                    {editingClient ? <Button variant="outline" onClick={() => { setEditingClient(null); setNewClient(""); }}>Annulla</Button> : null}
                  </div>
                  <div className="rounded-2xl border bg-white p-3 space-y-2">
                    {clients.map((c) => (
                      <div key={c} className="flex items-center justify-between gap-2 text-sm">
                        <span>{c}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => editClient(c)}>Modifica</Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteClient(c)}>Elimina</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm lg:col-span-3">
                <CardHeader><CardTitle>Anagrafica articoli</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                    <div className="space-y-2"><Label>Codice</Label><Input value={newArticle.code} onChange={(e) => setNewArticle((s) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder="Es. MPSA00001" /></div>
                    <div className="space-y-2 lg:col-span-2"><Label>Descrizione</Label><Input value={newArticle.desc} onChange={(e) => setNewArticle((s) => ({ ...s, desc: e.target.value }))} placeholder="Descrizione articolo" /></div>
                    <div className="space-y-2"><Label>UM disponibili</Label><Input value={newArticle.uoms} onChange={(e) => setNewArticle((s) => ({ ...s, uoms: e.target.value }))} placeholder="KG,MQ,M" /></div>
                    <div className="space-y-2"><Label>KG → MQ</Label><Input inputMode="decimal" value={newArticle.kgToMq} onChange={(e) => setNewArticle((s) => ({ ...s, kgToMq: e.target.value }))} placeholder="es. 18" /></div>
                    <div className="space-y-2"><Label>MQ → M</Label><Input inputMode="decimal" value={newArticle.mqToM} onChange={(e) => setNewArticle((s) => ({ ...s, mqToM: e.target.value }))} placeholder="es. 1.3" /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                    <div className="space-y-2"><Label>KG → M</Label><Input inputMode="decimal" value={newArticle.kgToM} onChange={(e) => setNewArticle((s) => ({ ...s, kgToM: e.target.value }))} placeholder="opzionale" /></div>
                    <div className="lg:col-span-5 flex items-end gap-2">
                      <Button onClick={addArticle}>{editingArticleCode ? "Salva modifica" : "Aggiungi articolo"}</Button>
                      {editingArticleCode ? <Button variant="outline" onClick={cancelArticleEdit}>Annulla</Button> : null}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                    Le conversioni sono per articolo. Esempi supportati: KG → MQ, MQ → M, KG → M. Questo prepara l'app a gestire casi come KG = MQ o MQ = metri lineari.
                  </div>
                  <div className="rounded-2xl border bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codice</TableHead>
                          <TableHead>Descrizione</TableHead>
                          <TableHead>UM</TableHead>
                          <TableHead>KG → MQ</TableHead>
                          <TableHead>MQ → M</TableHead>
                          <TableHead>KG → M</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articleCodes.map((code) => (
                          <TableRow key={code}>
                            <TableCell className="font-medium">{code}</TableCell>
                            <TableCell>{articleCatalog[code].desc}</TableCell>
                            <TableCell>{articleCatalog[code].uoms.join(", ")}</TableCell>
                            <TableCell>{articleCatalog[code].conversions?.KG_to_MQ ?? ""}</TableCell>
                            <TableCell>{articleCatalog[code].conversions?.MQ_to_M ?? ""}</TableCell>
                            <TableCell>{articleCatalog[code].conversions?.KG_to_M ?? ""}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => loadArticleForEdit(code)}>Modifica</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteArticle(code)}>Elimina</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>Test rapidi inclusi</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <div>1. Carico di un pallet Secad con UM selezionabile.</div>
            <div>2. Prelievo verso produzione con comparsa nel tab Produzione.</div>
            <div>3. Consumo da Produzione con rimozione della riga dal tab Produzione.</div>
            <div>4. Ricerca per codice, fornitore, cliente e lotto.</div>
            <div className="mt-4 rounded-xl border bg-slate-50 p-3">
              <div className="mb-2 font-medium text-slate-800">QA checks</div>
              {qaChecks.map((check) => (
                <div key={check.name} className="flex items-center justify-between py-1">
                  <span>{check.name}</span>
                  <span>{check.ok ? "OK" : "ERRORE"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
