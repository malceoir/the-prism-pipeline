# Hardware Integration & Zebra ZPL II Label Printing

This document details the industrial thermal printer integration, label layout geometry, and hardware communication protocols used in **The Prism Pipeline**.

---

## 1. Physical Hardware Environment

In a busy retail counter environment, inventory stickers must be printed immediately as items are appraised:
* **Target Printers**: Zebra GK420d, ZD420, and compatible 203 DPI direct thermal printers.
* **Label Media**: Standard $60\text{mm} \times 25\text{mm}$ (approx. $2.36" \times 1"$) thermal label rolls.
* **Printer Communication**: Raw TCP socket over local network (Port 9100) or USB COM port emulation.

---

## 2. The 2-on-1 Split-Compact Label Design

Standard retail inventory workflows print one sticker per item. For high-volume card trading, this quickly consumes expensive label rolls and creates unnecessary physical bulk.

To solve this, the pipeline implements a **2-on-1 Split-Compact Layout**:
* A single physical sticker is divided into two distinct columns:
  * **Left Item**: Positioned at horizontal offset $X = 16$ dots.
  * **Right Item**: Positioned at horizontal offset $X = 256$ dots.
* Two items are printed simultaneously during a single thermal pass.
* Cuts label roll consumption by **50%** in daily retail operations.

```text
┌───────────────────────────────────┬───────────────────────────────────┐
│ [X=16] Left Card                  │ [X=256] Right Card                │
│ Charizard #4 Holo                 │ Mishra's Factory (Fall)           │
│                                   │                                   │
│ $349.99                           │ $32.50                            │
└───────────────────────────────────┴───────────────────────────────────┘
```

---

## 3. ZPL II Bytecode Architecture (`hardware/zebraZplService.ts`)

Zebra Programming Language (ZPL II) commands are generated directly in TypeScript without external third-party print drivers.

### Sample Generated ZPL Output
```zpl
^XA
~SD12
^LH0,0
^FO16,24^ADN,18,10^FDCharizard #4 Holo^FS
^FO16,76^ADN,36,20^FD$349.99^FS
^FO256,24^ADN,18,10^FDMishra''s Factory^FS
^FO256,46^ADN,18,10^FD(Fall)^FS
^FO256,76^ADN,36,20^FD$32.50^FS
^XZ
```

### Key ZPL Commands Used:
* **`^XA ... ^XZ`**: Start and end of a label format.
* **`~SD12`**: Thermal Darkness Setting. Set to 12 for crisp, high-contrast black print on thermal top-coated paper.
* **`^LH0,0`**: Label Home offset anchor ($X=0, Y=0$).
* **`^FO<X>,<Y>`**: Field Origin. Sets coordinate location for text placement.
* **`^ADN,18,10`**: Scalable native alphanumeric font D. Compact 18-dot height by 10-dot width for card names; larger 36-dot height by 20-dot width for retail pricing.
* **`^FD ... ^FS`**: Field Data and Field Separator. Encloses the text to be printed.

---

## 4. Operational Spooling & Error Handling

1. **Direct Socket Connection**: The production sync service connects via TCP socket directly to the printer's static IP address on Port 9100.
2. **Buffer Safety**: If the printer runs out of labels or is temporarily turned off, commands are buffered locally in an SQLite spool queue rather than dropped.
3. **Escaped Characters**: Double quotes, apostrophes, and special characters are automatically sanitized into valid ZPL string escapes to prevent printer command injection or syntax errors.
