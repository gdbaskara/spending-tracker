"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp, parseRpInput, dateChipLabel, todayISO, yesterdayISO } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { CatIcon, Avatar } from "@/components/primitives";
import { CuteCalendar } from "@/components/CuteCalendar";
import { PROFILES } from "@/lib/seed";
import { scanReceipt } from "@/lib/scan";
import { compressImage } from "@/lib/image";
import type { Expense, PersonId, SplitType } from "@/lib/types";
import { AmountInput } from "./add/AmountInput";
import { DeleteConfirmOverlay } from "./add/DeleteConfirmOverlay";
import { SavedOverlay } from "./add/SavedOverlay";
import { ReceiptField } from "./add/ReceiptField";
import { CropEditor } from "./add/CropEditor";
import { seg, segWrap, fieldLabel, chip } from "./add/styles";

export function AddModal({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: Expense; // when set, the modal edits this expense instead of adding
}) {
  const { categories, addExpense, editExpense, deleteExpense, me, receiptUrl } = useStore();
  const isEdit = !!editing;
  // Real today/yesterday — stable for the lifetime of this modal instance.
  const [today] = React.useState(todayISO);
  const [yesterday] = React.useState(yesterdayISO);
  const quickDates = React.useMemo(() => [today, yesterday], [today, yesterday]);
  const [amount, setAmount] = React.useState(editing?.amount ?? 0);
  const [catId, setCatId] = React.useState(editing?.category_id ?? categories[0]?.id ?? "makan");
  // new expense defaults to the logged-in user as payer
  const [payer, setPayer] = React.useState<PersonId>(editing?.payer_id ?? me);
  const [split, setSplit] = React.useState<SplitType>(editing?.split_type ?? "equal");
  const [desc, setDesc] = React.useState(editing?.description ?? "");
  const [date, setDate] = React.useState(editing?.spent_at ?? today);
  const [showCal, setShowCal] = React.useState(
    editing ? !quickDates.includes(editing.spent_at) : false
  );
  const [saved, setSaved] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  // custom split: Mei's share (rest goes to Baskara). Seeded from existing.
  const [meiShare, setMeiShare] = React.useState(editing?.shares.mei ?? 0);

  // Receipt scan state
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = React.useState(false);
  const [scanMsg, setScanMsg] = React.useState<string | null>(null);

  // Receipt attachment state
  const [receiptBlob, setReceiptBlob] = React.useState<Blob | null>(null); // new/replacement
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null); // data URL of the above
  const [existingUrl, setExistingUrl] = React.useState<string | null>(null); // edit: resolved existing receipt
  const [removeReceipt, setRemoveReceipt] = React.useState(false);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [receiptBusy, setReceiptBusy] = React.useState(false);

  // Edit mode: resolve a viewable URL for the already-saved receipt.
  React.useEffect(() => {
    let alive = true;
    if (editing?.receipt_path) {
      receiptUrl(editing.receipt_path).then((u) => alive && setExistingUrl(u));
    }
    return () => {
      alive = false;
    };
  }, [editing, receiptUrl]);

  // What the receipt field/editor shows: a freshly picked image wins; otherwise
  // the existing one (unless the user removed it).
  const receiptSrc = receiptPreview ?? (removeReceipt ? null : existingUrl);

  // Compress + attach a chosen photo (used by scan and by manual attach/replace).
  const attachReceipt = React.useCallback(async (file: File) => {
    setReceiptBusy(true);
    try {
      const { blob, dataUrl } = await compressImage(file);
      setReceiptBlob(blob);
      setReceiptPreview(dataUrl);
      setRemoveReceipt(false);
    } catch {
      // keep the previous receipt on failure
    } finally {
      setReceiptBusy(false);
    }
  }, []);

  const onRemoveReceipt = React.useCallback(() => {
    setReceiptBlob(null);
    setReceiptPreview(null);
    setRemoveReceipt(true);
  }, []);

  const onPickReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setScanning(true);
    setScanMsg(null);
    // Keep the scanned photo as the attached receipt too.
    void attachReceipt(file);
    try {
      const r = await scanReceipt(file);
      if (r.amount > 0) setAmount(r.amount);
      if (r.category_id && categories.some((c) => c.id === r.category_id)) setCatId(r.category_id);
      if (r.spent_at) {
        setDate(r.spent_at);
        // Open the calendar on an unusual (non today/yesterday) scanned date so
        // the user can verify it; collapse it back for the quick dates.
        setShowCal(!quickDates.includes(r.spent_at));
      }
      const note = r.description || r.merchant;
      if (note) setDesc(note);
      setScanMsg(
        r.amount > 0
          ? `Terbaca${r.confidence === "low" ? " (cek lagi ya)" : ""} — cek lalu Simpan`
          : "Nggak nemu totalnya, isi manual ya"
      );
    } catch (err) {
      setScanMsg(err instanceof Error ? err.message : "Gagal memindai struk");
    } finally {
      setScanning(false);
    }
  };

  const canSave = amount > 0;

  // Parse digits typed into the native numeric input into integer rupiah.
  const onAmountInput = React.useCallback((raw: string) => {
    setAmount((a) => parseRpInput(raw, a));
  }, []);

  // When switching to custom split, seed the slider at half (unless editing an
  // existing custom expense, which already has its share loaded).
  React.useEffect(() => {
    if (split === "custom" && meiShare === 0 && amount > 0) {
      setMeiShare(Math.floor(amount / 2));
    }
  }, [split, amount, meiShare]);

  const save = React.useCallback(() => {
    if (!canSave) return;
    const input = {
      amount,
      category_id: catId,
      payer_id: payer,
      description: desc,
      spent_at: date,
      split_type: split,
      customShares:
        split === "custom"
          ? { mei: Math.min(meiShare, amount), bas: amount - Math.min(meiShare, amount) }
          : undefined,
      receiptBlob: receiptBlob ?? undefined,
      removeReceipt,
    };
    if (isEdit && editing) {
      editExpense(editing.id, input);
      onClose();
    } else {
      addExpense(input);
      setSaved(true);
      setTimeout(onClose, 1100);
    }
  }, [canSave, amount, catId, payer, desc, date, split, meiShare, receiptBlob, removeReceipt, addExpense, editExpense, isEdit, editing, onClose]);

  const doDelete = React.useCallback(() => {
    if (editing) deleteExpense(editing.id);
    onClose();
  }, [editing, deleteExpense, onClose]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "Enter") return save();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, onClose]);

  const cat = categories.find((c) => c.id === catId);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(63,53,48,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      className="anim-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="add-modal anim-pop"
        style={{ width: "100%", maxWidth: 460, maxHeight: "92vh", overflow: "auto", background: UI.bg, borderRadius: 28, padding: "22px 24px 26px", position: "relative" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 19, color: UI.ink }}>
            {isEdit ? "Edit pengeluaran" : "Catat pengeluaran"}
          </div>
          <div
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(196,170,142,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke={UI.ink} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Scan receipt */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickReceipt}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          style={{
            width: "100%",
            marginTop: 6,
            border: `1.5px dashed ${UI.accent}`,
            borderRadius: 16,
            padding: "12px",
            background: UI.accentSoft,
            color: UI.accentDk,
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: 14.5,
            cursor: scanning ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
          }}
        >
          {scanning ? (
            <>
              <span className="anim-blink">📷</span> Membaca struk…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Scan struk
            </>
          )}
        </button>
        {scanMsg && (
          <div style={{ fontSize: 12.5, color: UI.sub, textAlign: "center", marginTop: 7, marginBottom: 4, lineHeight: 1.4 }}>{scanMsg}</div>
        )}

        {/* Receipt attachment (thumbnail + crop / replace / remove) */}
        <div style={{ marginTop: 12 }}>
          <ReceiptField
            src={receiptSrc}
            busy={receiptBusy || scanning}
            onPick={attachReceipt}
            onCrop={() => receiptSrc && setCropSrc(receiptSrc)}
            onRemove={onRemoveReceipt}
          />
        </div>

        {/* Amount — native numeric keyboard (system numpad on mobile) */}
        <div style={{ textAlign: "center", padding: "14px 0 18px" }}>
          <AmountInput amount={amount} onAmount={onAmountInput} autoFocus={!isEdit} />
          {amount > 0 && (
            <div style={{ fontSize: 13, color: UI.sub, marginTop: 5 }}>
              {split === "equal"
                ? `Masing-masing ${fmtRp(Math.floor(amount / 2))}`
                : split === "full"
                ? `Ditanggung penuh ${PROFILES[payer].name}`
                : `Mei ${fmtRp(meiShare)} · Baskara ${fmtRp(amount - meiShare)}`}
            </div>
          )}
        </div>

        {/* Category */}
        <div style={fieldLabel}>KATEGORI</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {categories.map((c) => {
            const active = c.id === catId;
            return (
              <div key={c.id} onClick={() => setCatId(c.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <div style={{ borderRadius: 16, padding: 3, transition: "all .15s", background: active ? `${c.color}33` : "transparent", boxShadow: active ? `0 0 0 2px ${c.color}` : "none" }}>
                  <CatIcon cat={c.id} size={42} radius={13} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: active ? UI.ink : UI.sub, textAlign: "center", lineHeight: 1.1 }}>{c.name}</div>
              </div>
            );
          })}
        </div>

        {/* Payer */}
        <div style={fieldLabel}>SIAPA YANG BAYAR?</div>
        <div style={segWrap}>
          {(["mei", "bas"] as const).map((p) => (
            <div key={p} onClick={() => setPayer(p)} style={seg(payer === p, PROFILES[p].color)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Avatar pid={p} size={22} />
                {PROFILES[p].name}
              </div>
            </div>
          ))}
        </div>

        {/* Split */}
        <div style={fieldLabel}>DIBAGI GIMANA?</div>
        <div style={segWrap}>
          <div onClick={() => setSplit("equal")} style={seg(split === "equal")}>
            Bagi rata
          </div>
          <div onClick={() => setSplit("custom")} style={seg(split === "custom")}>
            Beda porsi
          </div>
          <div onClick={() => setSplit("full")} style={seg(split === "full")}>
            Sendiri
          </div>
        </div>

        {/* Custom split: a slider sets Mei's share, the rest goes to Baskara */}
        {split === "custom" && amount > 0 && (
          <div style={{ marginBottom: 16, marginTop: -4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: UI.ink }}>
                <Avatar pid="mei" size={18} /> {fmtRp(meiShare)}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: UI.ink }}>
                {fmtRp(amount - meiShare)} <Avatar pid="bas" size={18} />
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={amount}
              step={1000}
              value={meiShare}
              onChange={(e) => setMeiShare(Math.min(amount, Number(e.target.value)))}
              style={{ width: "100%", accentColor: UI.accent }}
            />
          </div>
        )}

        {/* Description */}
        <div style={fieldLabel}>CATATAN</div>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Buat apa nih? (opsional)"
          style={{ width: "100%", boxSizing: "border-box", border: "none", background: "#fff", borderRadius: 14, padding: "13px 15px", fontSize: 15, color: UI.ink, outline: "none", boxShadow: "0 4px 12px rgba(196,170,142,0.12)", marginBottom: 16 }}
        />

        {/* Date */}
        <div style={fieldLabel}>TANGGAL</div>
        <div style={{ display: "flex", gap: 8, marginBottom: showCal ? 0 : 18, flexWrap: "wrap" }}>
          <div onClick={() => { setDate(today); setShowCal(false); }} style={chip(date === today)}>
            Hari ini
          </div>
          <div onClick={() => { setDate(yesterday); setShowCal(false); }} style={chip(date === yesterday)}>
            Kemarin
          </div>
          <div onClick={() => setShowCal((s) => !s)} style={chip(showCal || (date !== today && date !== yesterday))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
            {date !== today && date !== yesterday ? dateChipLabel(date) : "Tanggal lain"}
          </div>
        </div>
        {showCal && (
          <div style={{ marginBottom: 18 }}>
            <CuteCalendar value={date} onChange={(d) => setDate(d)} />
          </div>
        )}

        {/* Save */}
        <button
          onClick={save}
          disabled={!canSave}
          className="press"
          style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 17, color: "#fff", cursor: canSave ? "pointer" : "default", transition: "all .2s", background: canSave ? UI.accent : "#E7DDD4", boxShadow: canSave ? "0 8px 20px rgba(255,138,91,0.4)" : "none" }}
        >
          {isEdit ? "Simpan perubahan" : "Simpan"}
        </button>

        {/* Delete (edit mode only) */}
        {isEdit && (
          <button
            onClick={() => setConfirmDel(true)}
            className="press"
            style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 16, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.bad, background: "transparent", cursor: "pointer" }}
          >
            Hapus transaksi
          </button>
        )}

        {/* Delete confirm */}
        {confirmDel && (
          <DeleteConfirmOverlay
            amount={amount}
            categoryName={cat?.name}
            onCancel={() => setConfirmDel(false)}
            onConfirm={doDelete}
          />
        )}

        {/* Celebration */}
        {saved && <SavedOverlay amount={amount} categoryName={cat?.name} />}

        {/* Crop & rotate editor */}
        {cropSrc && (
          <CropEditor
            src={cropSrc}
            onCancel={() => setCropSrc(null)}
            onDone={(img) => {
              setReceiptBlob(img.blob);
              setReceiptPreview(img.dataUrl);
              setRemoveReceipt(false);
              setCropSrc(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
