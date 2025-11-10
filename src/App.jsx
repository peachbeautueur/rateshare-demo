import { useState, useEffect } from "react";

/**
 * RateShare – Add Calculator + Master Data / Manage Calculators
 * Single-file React component (drop into Vite as App.jsx)
 *
 * Uses LocalStorage for persistence. "Open" and "Edit" go to the same editor.
 * No developer-only previews are shown to end users.
 */

// ——— Utilities ———
const LS_KEYS = {
  calculators: "rs_calculators",
  customers: "rs_customers",
  charges: "rs_charges",
  restrictions: "rs_restrictions",
  insurances: "rs_insurances",
};

function lsLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(data) ? fallback : data;
  } catch (_) {
    return fallback;
  }
}
function lsSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

// Helper used by handleSubmit and smoke tests
function buildSubmitMessage(payload) {
  return "Submitted!\n\n" + JSON.stringify(payload, null, 2);
}

function cryptoId() { return Math.random().toString(36).slice(2, 9); }
function mkRow(r) { return { id: cryptoId(), ...r }; }

export default function App() {
  // —— App nav ——
  const [view, setView] = useState("add"); // "add" | "calculators" | "master" | "calcEditor"
  const [masterView, setMasterView] = useState(null); // null | 'customers' | 'charges' | 'services' | 'insurance'

  // Selected calculator for edit/open
  const [editingCalc, setEditingCalc] = useState(null); // row object or null

  // Step 1 state (Add Calculator)
  const [rateFile, setRateFile] = useState(null);
  const [advantageActive, setAdvantageActive] = useState(true);
  const [fuelType, setFuelType] = useState("standard"); // "standard" | "custom"
  const [customFuelNote, setCustomFuelNote] = useState("");

  // Step 2 state
  const [customerMode, setCustomerMode] = useState("map"); // "map" | "create"
  const [existingCustomer, setExistingCustomer] = useState("");
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });

  // Demo customer list for mapping (typeahead)
  const demoCustomers = [
    "Acme Logistics",
    "Nordic Freight A/S",
    "Polar Express Co.",
    "Zentao Manufacturing",
    "GreenSea Importers",
  ];

  // —— Manage Calculators table (persisted) ——
  const [calcRows, setCalcRows] = useState(() => lsLoad(LS_KEYS.calculators, [
    mkRow({
      customerName: "Acme Logistics",
      customerCode: "ACM001",
      quoteNumber: "Q-2025-0001",
      validFrom: "2025-10-01",
      validTo: "2026-03-31",
      zip: "2100",
      city: "Copenhagen",
      country: "DK",
      salesContact: "M. Jensen",
      salesOffice: "Copenhagen",
    }),
    mkRow({
      customerName: "Nordic Freight A/S",
      customerCode: "NFX888",
      quoteNumber: "Q-2025-0042",
      validFrom: "2025-09-15",
      validTo: "2026-09-14",
      zip: "8000",
      city: "Aarhus",
      country: "DK",
      salesContact: "S. Larsen",
      salesOffice: "Aarhus",
    }),
  ]));

  // —— Manage Customers (persisted) ——
  const [customers, setCustomers] = useState(() => lsLoad(LS_KEYS.customers, [
    { id: cryptoId(), customerName: "Acme Logistics", contactName: "Mary Jensen", telephone: "+45 11 22 33 44", email: "mary@acme.com", refs: "ACM001" },
    { id: cryptoId(), customerName: "Nordic Freight A/S", contactName: "Soren Larsen", telephone: "+45 22 33 44 55", email: "soren@nfx.dk", refs: "NFX888" },
  ]));

  // Auto-reseed customers if LocalStorage has an empty array
  useEffect(() => {
    if (!customers || customers.length === 0) {
      const seed = [
        { id: cryptoId(), customerName: "Acme Logistics", contactName: "Mary Jensen", telephone: "+45 11 22 33 44", email: "mary@acme.com", refs: "ACM001" },
        { id: cryptoId(), customerName: "Nordic Freight A/S", contactName: "Soren Larsen", telephone: "+45 22 33 44 55", email: "soren@nfx.dk", refs: "NFX888" },
      ];
      setCustomers(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [createCustomer, setCreateCustomer] = useState({ customerName: "", contactName: "", telephone: "", email: "" });

  // —— Variable Charges (persisted) ——
  const [charges, setCharges] = useState(() => lsLoad(LS_KEYS.charges, [
    { id: cryptoId(), name: "Energitillæg", originCountry: "DK", originZip: "*", destCountry: "World", destZip: "*", currency: "DKK", calcType: "Percentage", amount: 10, minCharge: "-", maxCharge: "-", validFrom: "2025-01-01", validTo: "2025-12-31", isService: false },
  ]));

  // —— Service Management (Unit type restrictions) (persisted) ——
  const [restrictions, setRestrictions] = useState(() => lsLoad(LS_KEYS.restrictions, [
    { id: cryptoId(), text: "Pallet max 10", unitType: "pll", unitsMax: 10, weightMax: 1200 },
  ]));

  // —— Insurance Management (persisted) ——
  const [insurances, setInsurances] = useState(() => lsLoad(LS_KEYS.insurances, [
    { id: cryptoId(), name: "Basic", order: 0, infoText: "Standard coverage", chargeText: "1% of cargo", currency: "DKK", amount: 100, link: "#" },
  ]));

  // persist whenever data arrays change
  useEffect(() => { lsSave(LS_KEYS.calculators, calcRows); }, [calcRows]);
  useEffect(() => { lsSave(LS_KEYS.customers, customers); }, [customers]);
  useEffect(() => { lsSave(LS_KEYS.charges, charges); }, [charges]);
  useEffect(() => { lsSave(LS_KEYS.restrictions, restrictions); }, [restrictions]);
  useEffect(() => { lsSave(LS_KEYS.insurances, insurances); }, [insurances]);

  // Manage Calculators actions — Open == Edit (navigates to editor view)
  const openCalculator = (row) => { setEditingCalc(row); setView("calcEditor"); };
  const grantAccess = (row) => alert(`Grant Customer Access → ${row.customerName}`);
  const revokeAccess = (row) => alert(`Revoke Customer Access → ${row.customerName}`);
  const editRow = (row) => { setEditingCalc(row); setView("calcEditor"); };
  const deleteRow = (row) => { if (confirm(`Delete calculator for ${row.customerName}?`)) setCalcRows((r) => r.filter((x) => x.id !== row.id)); };

  const handleFile = (e) => { const file = e.target.files?.[0]; if (file) setRateFile(file); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      step1: { advantageActive, fuelType, customFuelNote: fuelType === "custom" ? customFuelNote : undefined, rateFile: rateFile?.name ?? null },
      step2: customerMode === "map" ? { mode: "map", existingCustomer } : { mode: "create", ...newContact },
    };
    alert(buildSubmitMessage(payload));
  };

  // ——— Render ———
  return (
    <div style={styles.appWrap}>
      {/* Top Bar */}
      <header style={styles.topbar}>
        <div style={styles.brandWrap}><Logo /><span style={styles.brandText}>RateShare</span></div>
        <div style={styles.topbarRight}>
          <input style={styles.search} placeholder="Search…" />
          <button style={styles.pillBtn}>Dark Mode</button>
          <button style={styles.pillBtn}>Settings</button>
        </div>
      </header>

      {/* Body */}
      <div style={styles.body}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSectionTitle}>Forwarder Operations</div>
          <SidebarButton title="Dashboard" />

          <div style={{ height: 16 }} />
          <div style={styles.sidebarSectionTitle}>Tools</div>
          <SidebarButton title="Add Calculator" active={view === "add"} onClick={() => { setView("add"); }} />
          <SidebarButton title="Manage Calculators" active={view === "calculators"} onClick={() => { setView("calculators"); }} />

          <div style={{ flex: 1 }} />
          <SidebarButton title="Master Data" active={view === "master"} onClick={() => { setView("master"); setMasterView(null); }} />
        </aside>

        {/* Main content */}
        <main style={styles.main}>
          {view === "add" && (
            <AddCalculator
              rateFile={rateFile} handleFile={handleFile}
              advantageActive={advantageActive} setAdvantageActive={setAdvantageActive}
              fuelType={fuelType} setFuelType={setFuelType}
              customFuelNote={customFuelNote} setCustomFuelNote={setCustomFuelNote}
              customerMode={customerMode} setCustomerMode={setCustomerMode}
              existingCustomer={existingCustomer} setExistingCustomer={setExistingCustomer}
              newContact={newContact} setNewContact={setNewContact}
              demoCustomers={demoCustomers} handleSubmit={handleSubmit}
            />
          )}

          {view === "calculators" && (
            <ManageCalculators
              rows={calcRows}
              onOpen={openCalculator} onGrant={grantAccess} onRevoke={revokeAccess}
              onEdit={editRow} onDelete={deleteRow}
            />
          )}

          {view === "master" && (
            <MasterDataHub
              masterView={masterView} setMasterView={setMasterView}
              customers={customers} setCustomers={setCustomers}
              createCustomer={createCustomer} setCreateCustomer={setCreateCustomer}
              charges={charges} setCharges={setCharges}
              restrictions={restrictions} setRestrictions={setRestrictions}
              insurances={insurances} setInsurances={setInsurances}
            />
          )}

          {view === "calcEditor" && editingCalc && (
            <CalculatorEditor
              value={editingCalc}
              onCancel={() => { setEditingCalc(null); setView("calculators"); }}
              onSave={(updated) => {
                setCalcRows((rows) => rows.map(r => r.id === updated.id ? updated : r));
                setEditingCalc(null);
                setView("calculators");
              }}
            />
          )}
        </main>
      </div>

      <footer style={styles.footer}>© {new Date().getFullYear()} RateShare · Demo UI</footer>
    </div>
  );
}

// ——— Views ———
function AddCalculator(props) {
  const {
    rateFile,
    handleFile,
    advantageActive,
    setAdvantageActive,
    fuelType,
    setFuelType,
    customFuelNote,
    setCustomFuelNote,
    customerMode,
    setCustomerMode,
    existingCustomer,
    setExistingCustomer,
    newContact,
    setNewContact,
    demoCustomers,
    handleSubmit,
  } = props;

  return (
    <>
      <h2 style={styles.h2}>Add Calculator</h2>
      <p style={styles.subtle}>Create a pricing calculation and attach it to a customer.</p>

      <form onSubmit={handleSubmit} style={styles.cardGrid}>
        {/* STEP 1 */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>Step 1 — Inputs</div>
          <div style={styles.field}>
            <label style={styles.label}>Rate file</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ ...styles.button, cursor: "pointer" }}>
                Upload file
                <input type="file" onChange={handleFile} style={{ display: "none" }} />
              </label>
              {rateFile ? (
                <span style={styles.filePill}>{rateFile.name}</span>
              ) : (
                <span style={styles.hint}>No file selected</span>
              )}
            </div>
          </div>

          <div style={styles.fieldRow}>
            <label style={styles.label}>Advantage calculation active?</label>
            <input
              type="checkbox"
              checked={advantageActive}
              onChange={(e) => setAdvantageActive(e.target.checked)}
              aria-label="Advantage calculation active"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Fuel type</label>
            <div style={styles.inlineGroup}>
              {/* Per request: checkboxes, but mutually exclusive */}
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={fuelType === "standard"}
                  onChange={() => setFuelType("standard")}
                />
                <span>Standard</span>
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={fuelType === "custom"}
                  onChange={() => setFuelType("custom")}
                />
                <span>Custom</span>
              </label>
            </div>
          </div>

          {fuelType === "custom" && (
            <div style={styles.field}>
              <label style={styles.label}>Additional details (if custom)</label>
              <input
                style={styles.input}
                placeholder="Describe your custom fuel calculation…"
                value={customFuelNote}
                onChange={(e) => setCustomFuelNote(e.target.value)}
              />
            </div>
          )}
        </section>

        {/* STEP 2 */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>Step 2 — Customer</div>

          <div style={styles.field}>
            <label style={styles.label}>a) Map to existing or b) Create new</label>
            <div style={styles.inlineGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="customerMode"
                  value="map"
                  checked={customerMode === "map"}
                  onChange={(e) => setCustomerMode(e.target.value)}
                />
                <span>Map to existing</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="customerMode"
                  value="create"
                  checked={customerMode === "create"}
                  onChange={(e) => setCustomerMode(e.target.value)}
                />
                <span>Create new</span>
              </label>
            </div>
          </div>

          {customerMode === "map" ? (
            <div style={styles.field}>
              <label style={styles.label}>a) Map to existing customer name</label>
              <input
                list="customers"
                style={styles.input}
                placeholder="Start typing to search…"
                value={existingCustomer}
                onChange={(e) => setExistingCustomer(e.target.value)}
              />
              <datalist id="customers">
                {demoCustomers.map((c) => (
                  <option value={c} key={c} />
                ))}
              </datalist>
            </div>
          ) : (
            <>
              <div style={styles.field}>
                <label style={styles.label}>b) Contact Name</label>
                <input
                  style={styles.input}
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>b) Telephone</label>
                <input
                  style={styles.input}
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="e.g. +45 12 34 56 78"
                  inputMode="tel"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>b) Email</label>
                <input
                  style={styles.input}
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </>
          )}
        </section>

        {/* Actions (no Live Preview for clients) */}
        <section style={{ ...styles.card, alignSelf: "start" }}>
          <div style={styles.cardHeader}>Review & Submit</div>
          <button type="submit" style={{ ...styles.button, width: "100%" }}>
            Save Calculator
          </button>
        </section>
      </form>
    </>
  );
}

function ManageCalculators({ rows, onOpen, onGrant, onRevoke, onEdit, onDelete }) {
  return (
    <>
      <h2 style={styles.h2}>Manage Calculators</h2>
      <p style={styles.subtle}>Edit / delete calculators, manage customer access.</p>

      <section style={styles.card}>
        <div style={{ ...styles.cardHeader, marginBottom: 8 }}>Calculators</div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Customer name</th>
                <th>Customer Code</th>
                <th>Quote number</th>
                <th>Valid from</th>
                <th>Valid to</th>
                <th>Customer Zip code</th>
                <th>Customer City</th>
                <th>Customer Country</th>
                <th>Sales Contact</th>
                <th>Sales Office</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.customerName}</td>
                  <td>{r.customerCode}</td>
                  <td>{r.quoteNumber}</td>
                  <td>{r.validFrom}</td>
                  <td>{r.validTo}</td>
                  <td>{r.zip}</td>
                  <td>{r.city}</td>
                  <td>{r.country}</td>
                  <td>{r.salesContact}</td>
                  <td>{r.salesOffice}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={styles.actionBtn} onClick={() => onOpen(r)}>Open calculator</button>
                      <button style={styles.actionBtn} onClick={() => onGrant(r)}>Grant Customer Access</button>
                      <button style={styles.actionBtn} onClick={() => onRevoke(r)}>Revoke Customer Access</button>
                      <button style={styles.actionGhost} onClick={() => onEdit(r)}>Edit</button>
                      <button style={styles.actionDanger} onClick={() => onDelete(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function MasterDataHub({ masterView, setMasterView, customers, setCustomers, createCustomer, setCreateCustomer, charges, setCharges, restrictions, setRestrictions, insurances, setInsurances }) {
  if (masterView === 'customers') return <ManageCustomers {...{ customers, setCustomers, createCustomer, setCreateCustomer, setMasterView }} />;
  if (masterView === 'charges') return <ManageVariableCharges {...{ charges, setCharges, setMasterView }} />;
  if (masterView === 'services') return <ServiceManagement {...{ restrictions, setRestrictions, setMasterView }} />;
  if (masterView === 'insurance') return <InsuranceManagement {...{ insurances, setInsurances, setMasterView }} />;

  return (
    <>
      <h2 style={styles.h2}>Master Data</h2>
      <p style={styles.subtle}>Select a master data tool.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 16 }}>
        <CardLauncher title="Manage Customers" onOpen={() => setMasterView('customers')} />
        <CardLauncher title="Manage Variable Charges" onOpen={() => setMasterView('charges')} />
        <CardLauncher title="Service Management" onOpen={() => setMasterView('services')} />
        <CardLauncher title="Insurance Management" onOpen={() => setMasterView('insurance')} />
      </div>
    </>
  );
}

function CardLauncher({ title, onOpen }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MiniIcon />
          <div style={{ color: '#6b7280', fontSize: 14 }}>Open to manage this dataset</div>
        </div>
        <button style={styles.button} onClick={onOpen}>Open</button>
      </div>
    </section>
  );
}

function MiniIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M3 8h18" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="7" cy="6" r="1" fill="#94a3b8" />
      <circle cx="11" cy="6" r="1" fill="#94a3b8" />
    </svg>
  );
}

// 3) Manage Customers
function ManageCustomers({ customers, setCustomers, createCustomer, setCreateCustomer, setMasterView }) {
  const remove = (id) => setCustomers((xs) => xs.filter(x => x.id !== id));
  const add = () => {
    const { customerName, contactName, telephone, email } = createCustomer;
    if (!customerName || !contactName || !email) { alert('Please fill required fields'); return; }
    setCustomers((xs) => [...xs, { id: cryptoId(), customerName, contactName, telephone, email, refs: '' }]);
    setCreateCustomer({ customerName: '', contactName: '', telephone: '', email: '' });
    alert('Customer created');
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={styles.pillBtn} onClick={() => setMasterView(null)}>← Back</button>
        <h2 style={styles.h2}>Manage Customers</h2>
      </div>
      <p style={styles.subtle}>Create, edit, and remove customers.</p>

      <section style={styles.card}>
        <div style={{ ...styles.cardHeader, marginBottom: 8 }}>Customer list</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Name</th>
                <th>Telephone</th>
                <th>Email</th>
                <th>Customer references</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>{c.customerName}</td>
                  <td>{c.contactName}</td>
                  <td>{c.telephone}</td>
                  <td>{c.email}</td>
                  <td>{c.refs || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button style={styles.actionGhost} onClick={() => alert('Edit customer ' + c.customerName)}>Edit customer</button>
                      <button style={styles.actionDanger} onClick={() => remove(c.id)}>Remove customer</button>
                      <button style={styles.actionBtn} onClick={() => alert('Revoke access for ' + c.customerName)}>Revoke access</button>
                      <button style={styles.actionBtn} onClick={() => alert('New access details for ' + c.customerName)}>New access details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.card}>
        <div style={{ ...styles.cardHeader, marginBottom: 8 }}>Create customer</div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.label}>Customer Name</label>
            <input style={styles.input} value={createCustomer.customerName} onChange={(e)=>setCreateCustomer({ ...createCustomer, customerName: e.target.value })} placeholder="e.g. Acme Logistics" />
          </div>
          <div>
            <label style={styles.label}>Contact Name</label>
            <input style={styles.input} value={createCustomer.contactName} onChange={(e)=>setCreateCustomer({ ...createCustomer, contactName: e.target.value })} placeholder="Full name" />
          </div>
          <div>
            <label style={styles.label}>Telephone</label>
            <input style={styles.input} value={createCustomer.telephone} onChange={(e)=>setCreateCustomer({ ...createCustomer, telephone: e.target.value })} placeholder="+45 ..." />
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={createCustomer.email} onChange={(e)=>setCreateCustomer({ ...createCustomer, email: e.target.value })} placeholder="name@company.com" />
          </div>
        </div>
        <div style={{ height: 8 }} />
        <button style={styles.button} onClick={add}>Create customer</button>
      </section>
    </>
  );
}

// 4) Manage Variable Charges — buttons disabled (noop)
function ManageVariableCharges({ charges, setCharges, setMasterView }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={styles.pillBtn} onClick={() => setMasterView(null)}>← Back</button>
        <h2 style={styles.h2}>Manage Variable Charges</h2>
      </div>
      <p style={styles.subtle}>Create, edit, and remove variable charges.</p>

      <section style={styles.card}>
        <div style={{ ...styles.cardHeader, marginBottom: 8 }}>Charge list</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Charge Name</th><th>Origin country</th><th>Origin zip</th><th>Destination country</th><th>Destination zip</th><th>Currency</th><th>Calculation Type</th><th>Amount</th><th>Min Charge</th><th>Max Charge</th><th>Valid From</th><th>Valid to</th><th>Is service?</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {charges.map(ch => (
                <tr key={ch.id}>
                  <td>{ch.name}</td><td>{ch.originCountry}</td><td>{ch.originZip || '-'}</td><td>{ch.destCountry}</td><td>{ch.destZip || '-'}</td><td>{ch.currency}</td><td>{ch.calcType}</td><td>{ch.amount}</td><td>{ch.minCharge || '-'}</td><td>{ch.maxCharge || '-'}</td><td>{ch.validFrom || '-'}</td><td>{ch.validTo || '-'}</td><td>{ch.isService ? 'Yes' : 'No'}</td>
                  <td>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button style={styles.actionBtn} onClick={() => {}}>Add Charge</button>
                      <button style={styles.actionGhost} onClick={() => {}}>Edit charge</button>
                      <button style={styles.actionDanger} onClick={() => {}}>Remove charge</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// 5) Service Management (Unit type restrictions) — buttons disabled (noop)
function ServiceManagement({ restrictions, setRestrictions, setMasterView }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={styles.pillBtn} onClick={() => setMasterView(null)}>← Back</button>
        <h2 style={styles.h2}>Service Management</h2>
      </div>
      <p style={styles.subtle}>Unit type restrictions.</p>

      <section style={styles.card}>
        <div style={{ ...styles.cardHeader, marginBottom: 8 }}>Restrictions</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Restriction text</th><th>Unit type</th><th>Units max (if not kg)</th><th>Weight max</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restrictions.map(r => (
                <tr key={r.id}>
                  <td>{r.text}</td>
                  <td>{r.unitType}</td>
                  <td>{r.unitsMax}</td>
                  <td>{r.weightMax}</td>
                  <td>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button style={styles.actionBtn} onClick={() => {}}>Add</button>
                      <button style={styles.actionGhost} onClick={() => {}}>Edit</button>
                      <button style={styles.actionDanger} onClick={() => {}}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// 6) Insurance Management — buttons disabled (noop)
function InsuranceManagement({ insurances, setInsurances, setMasterView }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={styles.pillBtn} onClick={() => setMasterView(null)}>← Back</button>
        <h2 style={styles.h2}>Insurance Management</h2>
      </div>
      <p style={styles.subtle}>Insurance options</p>

      <section style={styles.card}>
        <div style={{ ...styles.cardHeader, marginBottom: 8 }}>Insurance options</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name*</th><th>order</th><th>Info text</th><th>Charge text</th><th>Charge currency</th><th>Charge amount</th><th>Link</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {insurances.map(i => (
                <tr key={i.id}>
                  <td>{i.name}</td><td>{i.order}</td><td>{i.infoText}</td><td>{i.chargeText}</td><td>{i.currency}</td><td>{i.amount}</td><td>{i.link}</td>
                  <td>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button style={styles.actionBtn} onClick={() => {}}>Add</button>
                      <button style={styles.actionGhost} onClick={() => {}}>Edit</button>
                      <button style={styles.actionDanger} onClick={() => {}}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// 2.5) Calculator Editor (used by Open / Edit)
function CalculatorEditor({ value, onCancel, onSave }) {
  const [model, setModel] = useState({ ...value });
  const update = (k, v) => setModel(m => ({ ...m, [k]: v }));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={styles.pillBtn} onClick={onCancel}>← Back</button>
        <h2 style={styles.h2}>Edit Calculator</h2>
      </div>
      <p style={styles.subtle}>Open / Edit 共用一个界面：保存后写入 LocalStorage。</p>

      <section style={styles.card}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <Field label="Customer name"><input style={styles.input} value={model.customerName||''} onChange={e=>update('customerName', e.target.value)} /></Field>
          <Field label="Customer Code"><input style={styles.input} value={model.customerCode||''} onChange={e=>update('customerCode', e.target.value)} /></Field>
          <Field label="Quote number"><input style={styles.input} value={model.quoteNumber||''} onChange={e=>update('quoteNumber', e.target.value)} /></Field>
          <Field label="Valid from"><input style={styles.input} type="date" value={model.validFrom||''} onChange={e=>update('validFrom', e.target.value)} /></Field>
          <Field label="Valid to"><input style={styles.input} type="date" value={model.validTo||''} onChange={e=>update('validTo', e.target.value)} /></Field>
          <Field label="Customer Zip code"><input style={styles.input} value={model.zip||''} onChange={e=>update('zip', e.target.value)} /></Field>
          <Field label="Customer City"><input style={styles.input} value={model.city||''} onChange={e=>update('city', e.target.value)} /></Field>
          <Field label="Customer Country"><input style={styles.input} value={model.country||''} onChange={e=>update('country', e.target.value)} /></Field>
          <Field label="Sales Contact"><input style={styles.input} value={model.salesContact||''} onChange={e=>update('salesContact', e.target.value)} /></Field>
          <Field label="Sales Office"><input style={styles.input} value={model.salesOffice||''} onChange={e=>update('salesOffice', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={styles.button} onClick={()=>onSave(model)}>Save</button>
          <button style={styles.actionGhost} onClick={onCancel}>Cancel</button>
        </div>
      </section>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function SidebarButton({ title, active = false, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        ...styles.sidebarBtn,
        ...(active ? styles.sidebarBtnActive : {}),
      }}
    >
      <span>{title}</span>
      {badge ? <span style={styles.badge}>{badge}</span> : null}
    </button>
  );
}

function Logo() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 15h14c2.8 0 5-2.2 5-5S17.8 5 15 5H3" stroke="#19A6FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 19h14c2.8 0 5-2.2 5-5s-2.2-5-5-5h-7" stroke="#19A6FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ——— Styles ———
const styles = {
  appWrap: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji'",
    color: "#222",
    background: "#f5f6f8",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    height: 64,
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px 0 12px",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  brandWrap: { display: "flex", alignItems: "center", gap: 10 },
  brandText: { fontWeight: 700, letterSpacing: 0.2 },
  topbarRight: { display: "flex", alignItems: "center", gap: 8 },
  search: {
    width: 320,
    height: 36,
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "0 12px",
    outline: "none",
  },
  pillBtn: {
    height: 36,
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "0 12px",
    background: "#fff",
    cursor: "pointer",
  },

  body: { display: "flex", flex: 1, gap: 16, padding: 16, maxWidth: 1280, margin: "0 auto", width: "100%" },
  sidebar: {
    width: 220,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    height: "fit-content",
  },
  sidebarSectionTitle: { fontSize: 12, fontWeight: 600, color: "#6b7280", padding: "8px 8px 0" },
  sidebarBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 12px",
    background: "#fff",
    border: "1px solid #eef0f3",
    borderRadius: 10,
    cursor: "pointer",
  },
  sidebarBtnActive: {
    borderColor: "#cfe9ff",
    background: "#f4faff",
  },
  badge: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: 999,
    fontSize: 12,
    lineHeight: "18px",
    padding: "0 6px",
  },

  main: { flex: 1, display: "flex", flexDirection: "column", gap: 12 },
  h2: { margin: 0, fontSize: 22 },
  subtle: { color: "#6b7280", marginTop: -4 },

  cardGrid: { display: "grid", gap: 16, gridTemplateColumns: "1.2fr 1.2fr 0.8fr" },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardHeader: { fontWeight: 600 },

  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 14, fontWeight: 600 },
  hint: { color: "#6b7280", fontSize: 13 },

  inlineGroup: { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
  checkboxLabel: { display: "flex", gap: 8, alignItems: "center", cursor: "pointer" },
  radioLabel: { display: "flex", gap: 8, alignItems: "center", cursor: "pointer" },

  input: {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
  },
  button: {
    height: 40,
    borderRadius: 10,
    border: "1px solid #cfe9ff",
    background: "#e8f4ff",
    fontWeight: 600,
    cursor: "pointer",
  },
  filePill: {
    background: "#f4faff",
    border: "1px solid #cfe9ff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  footer: {
    marginTop: 16,
    padding: 12,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  // Larger, more legible action buttons
  actionBtn: {
    border: "1px solid #cfe9ff",
    background: "#e8f4ff",
    borderRadius: 10,
    height: 36,
    padding: "0 14px",
    fontSize: 14,
    lineHeight: "34px",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  actionGhost: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    height: 36,
    padding: "0 14px",
    fontSize: 14,
    lineHeight: "34px",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  actionDanger: {
    border: "1px solid #fca5a5",
    background: "#fee2e2",
    borderRadius: 10,
    height: 36,
    padding: "0 14px",
    fontSize: 14,
    lineHeight: "34px",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
};

// Basic table styling via global CSS-in-JS
const styleEl = document.createElement('style');
styleEl.innerHTML = `
  html, body, #root { height: 100%; }
  body { background: #f5f6f8; }            /* ← 新增：整页灰色 */
  table thead th { text-align:left; font-weight:600; font-size:13px; color:#6b7280; padding:10px 12px; border-bottom:1px solid #e5e7eb; position:sticky; top:0; background:#fff; }
  table tbody td { padding:10px 12px; border-bottom:1px solid #f1f5f9; font-size:14px; }
  table tbody tr:hover { background:#f9fbff; }
`;
document.head.appendChild(styleEl);

// ——— Minimal smoke tests (runtime-only) ———
(function runSmokeTests(){
  try {
    const msg = buildSubmitMessage({ ok: true });
    console.assert(msg.startsWith("Submitted!"), "Message should start with 'Submitted!'");
    console.assert(msg.includes("{"), "Message should include JSON body");

    const k = '__rs_test__';
    const obj = { a: 1, b: 'x' };
    localStorage.setItem(k, JSON.stringify(obj));
    const back = JSON.parse(localStorage.getItem(k));
    console.assert(back && back.a === 1 && back.b === 'x', 'LocalStorage round-trip should work');
    localStorage.removeItem(k);

    // NEW: Verify action button styles exist
    console.assert(!!styles.actionBtn && !!styles.actionGhost && !!styles.actionDanger, 'Action button styles defined');

    // eslint-disable-next-line no-console
    console.log("✓ UI smoke tests passed");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Smoke tests failed:", e);
  }
})();



