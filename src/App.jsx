import React, { useState, useMemo, useEffect, useRef } from "react";
import { loadGoogleMaps } from "./lib/googleMaps.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";
import * as api from "./lib/api/index.js";
import { useAuth } from "./auth/AuthProvider.jsx";
import { signOut } from "./lib/api/auth.js";
import Login from "./auth/Login.jsx";
import PendingApproval from "./auth/PendingApproval.jsx";
import SetPassword from "./auth/SetPassword.jsx";
import ToolsPage from "./Tools.jsx";
import {
  LayoutDashboard, Inbox, Kanban, Building2, Users, Search,
  Phone, Mail, ChevronRight, X, Plug, ArrowRight, TrendingUp,
  MapPin, Bed, Bath, Car, CalendarPlus, MessageCircle, ClipboardList,
  Info, ListChecks, UserPlus, CheckCircle2, Circle,
  Compass, Upload, FileText, Map as MapIcon, DollarSign, Trophy, AlertCircle,
  Columns3, GripVertical, ShieldCheck, Target, Handshake, Calculator
} from "lucide-react";

/* ---------------------------------------------------------
   Design tokens (see <style> block below for full system)
   Ink navy / brass / paper — an agency ledger, not a template
--------------------------------------------------------- */

const SOURCES = {
  Property24: { label: "Property24", cls: "src-p24" },
  PrivateProperty: { label: "Private Property", cls: "src-pp" },
  Website: { label: "Company Website", cls: "src-web" },
};

const STAGES = [
  "New", "Contacted", "Viewing Booked", "Offer Made", "Sold", "Lost",
];

const OFFICE = "Benoni Office";

const AGENTS = [
  { id: "a1", name: "Alyassa", initials: "AL", office: OFFICE, closed: 5 },
  { id: "a2", name: "Ashton", initials: "AS", office: OFFICE, closed: 3 },
  { id: "a3", name: "Bronwyn", initials: "BR", office: OFFICE, closed: 7 },
  { id: "a4", name: "Chevaughn", initials: "CH", office: OFFICE, closed: 4 },
  { id: "a5", name: "Kaylee", initials: "KA", office: OFFICE, closed: 6 },
  { id: "a6", name: "Lauren", initials: "LA", office: OFFICE, closed: 2 },
  { id: "a7", name: "Leonard", initials: "LE", office: OFFICE, closed: 8 },
  { id: "a8", name: "Mike W", initials: "MW", office: OFFICE, closed: 3 },
  { id: "a9", name: "Nicole McG", initials: "NM", office: OFFICE, closed: 5 },
  { id: "a10", name: "Nicole W", initials: "NW", office: OFFICE, closed: 4 },
  { id: "a11", name: "Rox Ann", initials: "RA", office: OFFICE, closed: 6 },
  { id: "a12", name: "Tshepo", initials: "TS", office: OFFICE, closed: 9 },
  { id: "a13", name: "Logan", initials: "LO", office: OFFICE, closed: 2 },
];

// Admin Agent — a dedicated task-recipient identity, deliberately NOT part of
// AGENTS. Keeping it out of that array stops it appearing in commission
// splits, the leaderboard, targets, or deal-assignment dropdowns; it exists
// only to receive canvassing/OTP tasks and to log a narrow, deal-detail view.
const ADMIN_AGENT_ID = "admin-agent";
const ADMIN_AGENT = { id: ADMIN_AGENT_ID, name: "Admin Agent", initials: "AA", office: OFFICE };

// --- Access control -----------------------------------------------------
const MASTER_ADMINS = ["David", "Helena"];
const ROLE_LABELS = { masterAdmin: "Master Admin", officeManager: "Office Manager", agent: "Agent", marketing: "Marketing", officeAdmin: "Office Admin" };
const NAV_SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "pipeline", label: "Pipeline" },
  { key: "canvassing", label: "Canvassing" },
  { key: "teampipeline", label: "Team Pipeline" },
  { key: "offers", label: "Offers" },
  { key: "deals", label: "Deals" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "listings", label: "Listings" },
  { key: "contacts", label: "Contacts" },
  { key: "agents", label: "Agents" },
  { key: "todos", label: "My To-Dos" },
];
const DEFAULT_ROLE_PERMISSIONS = {
  officeManager: { dashboard: true, leads: true, pipeline: true, canvassing: true, teampipeline: true, offers: true, deals: true, leaderboard: true, listings: true, contacts: true, agents: true, todos: true },
  agent: { dashboard: true, leads: true, pipeline: true, canvassing: true, teampipeline: false, offers: true, deals: true, leaderboard: true, listings: true, contacts: false, agents: false, todos: true },
  officeAdmin: { dashboard: true, leads: false, pipeline: false, canvassing: true, teampipeline: false, offers: false, deals: true, leaderboard: false, listings: false, contacts: true, agents: false, todos: true },
};

const LOGO_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAIAAAAErfB6AAAnQklEQVR42u19eXxc1XX/Offe994sWkbraLMkW4t3Y+OVzcYYMMQGA0nJLw2kZKGkBELy6y9Jm+SXdCH9tSElIUmbpdmAJKUQtpiygzHGC3jfbS22rG00o12a9b137/n98SQh25KgrTVoxJyP//DMPN158773nuV7zj0X2Z3fh7RMX2HpR5AGOC1pgNOSBjgtaYDTkgY4LWmA05IGOA1wWtIApyUNcFrSAKclDXBa0gCnZVwRKXGXiMCAAAEAiBAACAABKNUeN47cOSXp5qc0wAwBkaRCaTFps6FnwxQwSEFwhyFGAoUgiCF9eAHmSArQNjnYCIY9Mz9amx8tz07keWy3pjSmUlhpEma67O9um9Ha62JCOQrpQwQwQ1KAVkwDri4qHVgzq6/cl4hZrG3AaO419rRl9sdF1GKKEFNwETMGVkTcc2VzeXa8pcuDQtGHZwUjAGNkxQQItWlR8Kqqvv6E2HEm63cH/N0DOkgGCMAIGAFSqi5fRhDRQhFdTfLCnXIAM0a2ZDIi1s3punVR56lu90Pby06FvAAAuhSGQpRAMIRtyuLLGVmcBEveDxBT5WfHhM9jfmXjacHo/20pbwp5wVCaxyICIlQEkKwpP7n2N+mT84MHWDAyw9rymX33Xt72+IHC5w4XgKG0DEsplGo6gPqhjoMFIzOs37y4Y+P8rq8/P6u1x61lWIrS0E4LgAUjc1C7bVXbivKBzz8x2wKmea00tNMEYM7IDGsfXdaxfMbgF5+qZToJJtPoThOAGSMrKlZV91xT03v3k7VcJ2CkKI3uJDzqDyDeRVAWK/TF774k8PUXZhFDZIoojcV0WcEMybL4X69t/unbxT2Dhua5MHYXAfB9ECBE75cleT9c8dTXOskGmDOyItqNSzo6I9qOk3l6lmnLC/OMpGIg+fu4A8neB5WNALapv/ck0Kw0wGdPeYler7mhtvcrz8/iHlvKC7N2SbF8b6Qyu89WDMcnGThTZ/p83VEvYxORwAggFS4qbhdcjp8MIAI83FlIU3sRi2Qv37D2J5e17mjOGhgwtIwLpJyRpGL57uj2Tz2iM1sRIo4NCBPq8t/csX0gmxkJOQ4wgikz4vn8JTt/csNmaWpjKmpbMc0TfXTP8j976hZhmHIKY5xUJ0sqdHmt5aXhJ4/kM/cFC4oUIdesE6HCd9qLgduWYlLhOf8syRhTzb2+A0E/atZ4tpMzZcZdSyuavr/+RdsU6rxxpEJbIqLqH8z85tbVxKa6d5g8gDmSiosrq3rru9zhAYNzdWEHB1sc7yoAPnaGVRGCsPd1FEeiXjGOfkYkZYssd+S3Nz3j4paUfEyvTRITrsQP31nZHPJrujnF/awkrmAEALqsfOCVRh9o6sI/F8JA2AsTjMrorZYykGw8Z5sDSEv8dMPzc4oCcdPgY/liilDXrNau/Ad3rWQuU015ZiZ5AFs2y/ElPLo6HvQybVIC3wn8HY6KTH17WxmIsf0mwZQZ9Xzhkp2fWLIvHvWIcTxtImSadf/2y/oGsgW3CdIAj8SUFlvkj7T26yohLnhClAiBq4WFIVBjOFhEqAnZ1p99pLMAhDxfeTimd8XMU/987ctW7N21qwhH/7MV043EodYZv95/MXfHpUqBmtQkedGIAApn50dPdnkA4cIuXwSwFXO5o4v9QbDF+RrYMcB7g0XhSIZ2nv/MkJQtfJ7Ib296Rme2KTU+XFWg69ZZ+VtC4OqbW9eYpqG5Y2mAzzWBRZnmm2eygSt1QTUbIpGtVReEyrP7peTnBzYEAIy2Nc8YMsBnA4wAtiV+dsuTNYUdI8pZEeq6dd9L63e3lOu6KQmBkCGZkr/dXsKMREqgmzyAlULQpFtTobAG/ALXBDMksPkSf1AYiXjUdb7+56jI0ne0lZ3vYwumzIj3vivevPWiA/HIELpSMcMTe/Lwoh++uQY0+6wJgTT12asPAGBJ6NIkAxhMCJyc2HFlSduY9fBEqAm71THAmj3aADum95JZDQ9c/YoZczmmlwi5sHsGM7/08jXcMMV5QbNMqaxXsvQMgcFJElgSL/hXSsVQM5cWdcBY+nnIAHcUDUa8GpM0at1LW+R6Bx+96VnBJNCQd6YIhW7+1etXtXYVcM2yFJOEo/9BSknyDAkNW7wLu3wRSUruzxyYk9dNY1ETNBQBl8PZnyKAsvm/3fBcVUEwYerOzJCKGe7Ya3Wzf7FnueaJ2Srl924l9QcgTs4PkHx+QZfPG7Ekx7EjYG1H61kGWDBlRT1/eflbtyw8NOJYEQDjMhp33/PyepgukvIzFJFAsuXF7SDs8wNcJwJuH8g+PMoAO6b38ur6f1z32ojpdZav5kr8/bYrTrSValM7hfAhAtihOFYUt49JcYw2wIJJGjK9Wn7GwKObnuH4rumVhC4jsfdMxT/vuFSkCIkx/QEeojhc0UX+TrAnMMAzHP8Lh0wv+8UNmyvzO0dMLwEgkq34F15ab9k6MjVtKohSHGAkkrw6t7c8u09Kcb4LzVGRpW1vKwOuFCFnyoq6v3bFm5sWHBlNOEvFdHf8B7tWvX2qSnNNn+Wb8gAzJLDFEn9QMxLWeagMGeD+7COhAhA2QzJj7jU1dd9Z9/po06sIDd2s6yj+261ruCuhplfp7nSYqiuGKI6xDfC+YNFAJEMXtm1phVl9j2x6FolGTO+QJmB070vXhmNexuXUTxB9iACemOIYoqBbZoDiDEEp/NWNm8vzuk3r3UIcWzHdHfv1vqUvn5ibKvmDDwvADsVRmDk4THHAmAZ4R2sZanY84v7G6q0b5h2NR91ilHLWNKu9N++rr61jukXTsfKepfatS74gvzNniOKgMQ3wsa48MrV1tSf/bu0WM+oaXadBhFyz//LVq7v6fXysMDoN8BSgOEoCY1IcjgE+GCrs68spye16eNMfgWA0meakjJ49suCxAxdpnmmonFMeYCIENi7FQQDA1LaWcrLFw5ueLfX1WKNMLxFybveFM+575VoUNI03zqQqwEMUhye6qDA0JsXBkUCKZ+tqvnzVa1fPOR6PuUcrZ0Ug3IlvbFl7JlQoNHMa73tLWYCRSIoqX2+5r/98isPxno51FM3N63rg6lfNqGc0upLQMMyXj8/76e7lwhOfrso5tQFmSGCzJUVBzYhbYyFEADGbf3fd6xzVOVEvEYKQL52aqSyDo4JpLSk9eXFlSfuYFIeTzF/iD87y9Y42vaO9s0219aiZ9nTflJyqAEtioJlLiwIwzv4DR1HbY33KkKSlrShpn5XfJS2NIaUBnooUh3+Y4pgAoTGxRwBLcpc7ct2sU2CLNMBT8qZtPv9digPGtMETThEAxW6oqQduT+/WEam6giegON4Nkyby0ZSytEtLW8tye+xpvYhTEuCJKQ7H+vbFXYjjEhgIYEqemRG+pvI0TGsznHoAj2xUuWgcikMwNWgaD76zguNEXUudtuKbauqBqTTRMdUoDl6V01uePTbFAUx1xzw/339x62CWEOP2YGBMkaVdUd5c6Ou1pcBpuohTD+BRVRzxMas4gMu6ntzOkP/1pgrQrPGKIxHAtEVu5sBVFWfAFDwN8JSSFSXtMNYeVCfJvztQjIo9dXI2qImCKAIAhE01dYDTNt2QegA7FMey4sCYBpghgeTvtBeTK/FGc0VLT64mbBrf0yZTW1txJidrwLIFpgGeShRHD0l+TsskAtCYGox6jnQWopHoH8h64VQVTqClkUyb+319q2c0g6VxptIATx2KIzxmFQcKu74nt30gU3AJjJ488Z5aGgHVjbX1QEDpFTxVKI7i8as4uDwQ9CvTQADUrLdayk935esT8yGWdk3l6YyMsC2noZZOMYCHKI6ScSkOANgdKHaiXI3LaCTjPxurYfzGWIhk2mJGbs+lZS1kCTbttHQqATxCcSwqDI2ZROJMkaXvCxYBl4rQmQ1PnZwNciIyUhECkzfW1MP4bRDTACeT4uiryO6X5xHIRKgx2TGYebInD7gkQkWImrWztay+s0AffxE7gfX6WadcnnFTF2mAk0Zx8MX+Ds01BsWhAEDIY935/WGv4NI530TjMh7xPtdYPUFagiFZllaV172ipI2mHS+dcnHwuFUczj7SfYGi0Sle582nTs4mW5uAq5KEqFk31DRM0AcvDXCSKI6lxR1jwoBAoNjuQPFohksSMt18p630RKhQm1hLW+L6WY2aezq0bUhJgN/dqJLbTec5TQQgmErEXQdDfsfDGvnI6VG4uaFmYi1tW2JuYWhxUUBZ2nTipVkq3ajNF+R35WaEz3eFiJAL2dSf3dTnw7O7eA9r6Vpl6RPUUNrEmG5urG4YkwFNA5wkimPZ+L04gMvDoUIz7hL8rP35jpbe2156NOR/Dy1t8w3VjdxI2OkN4B8cxREYf6MK7Q4Ug2LnN2oSTNlx17N1NaDJCbW0dpG/Y54/qCbZl07m2eWpAbBDcRju2EWFwXGTSLbY21E8ZkNwRQhCPlNXKxOGGJ+rshUTrviGqkaw+SQCjKRxMm02/MvSAI+q4qgYq4rDiXf7It6jXfnApRqLq2KadSBQcqijSExIW4JkG6vrUbckscmbrS6hBk0OSTkOIDUAfs8qDuSyric3OJjJ+Lj9vmXCeKa+dsx+0SPfIk1tWXGgJj8krUkptVSEIJRbUz0xASwZCaxU8iZWlLSNWUXnJJH2B/1k6uNp4GEtXWPHXeNdgwCW4oYnet2sUzA5AEuFmW6bI/VGNZZewedSHEUdoMZjmnB3oGQCk+aczHKko3hfoPg9tfSNNfUwCRv+EQFsrPDFBxNcJThPyjngKQDwEMWRMTg3v5tscX7GRzClTH1/8FyK4xzhTClTf6buPbS0srRVpW0Ved0XvCCeIaHNFhRGGntcSTvQPAUAHqriKOjKHaeKQ3DZPphV15MLYoKDykARgmY/W19jxtza+FralNzrjVw78zRe6GCJAIjRvMLonvbMSTl3JnVX8ERVHADA5dHO/HDUI0a1gx5HS9vHQ/497SVcNycopwWCG2vqickLiAECSIv5c2MuoRpDHq4l6cDVFAB44ioOh4nc01H8fvYJOofrPFU3e7zzswCAMaVM/YoZzUU5vfLCaWnGiEy+vrp3XyCDLJ60pORUB9ihOHRXbH5+p7Q0BXBO/3VFqCTfEyh+P2Glo6U311fHoh6GZJ/Xzd0ZMGaLrIzwHQsOU9x1oZBQCjWXvaw0/OLJXDSSd9a5mOoAI5GlzS3pmFPUAUBuYZ9PDIGtHQoVwEQnhZ7lS9eF/PsCxZfNPgFx15hxlwEAqO6/astLp2btD5RO4HW/T3EO1b1paeB4l7uvz3WhTuWcFgADAEC2y3z99KxEQj+Pw0KN2y392S0D2Sjel8lkSIrYj/csSyDE48bYmUEEpdAwzE8uPHos5P8ftnlAACWZ12uur+77yvOzmFsms9/pVAdYEjLNerO5fN2vPzMBRc80+30eBiEVQ8N87OjCxw5dBBOrX0IQNh/fWr/f5cvJHNC+sL75hfqc/kFD8yZv+aYAwCPLjunmexjX/0q8IoT9fn76UGnm/0w5m2Ht8rldBV7ru69WJhndlAH4vwxhckebwHO2TF6cG71zWceXN1dzXSW/GfV07gH2gWsd22IeLu+/runBbWU9ER3FB3BSQBrgSRHOyLa4h6kHb2r47T7/weZszWV/IL3k0wBPgtnjZEU1v8d86Ob6Jw4UbDmel3zTm3o2OFUWrlRoDuiXVPfcdUn7j7eX7mny6RmW/cGdA5EG+IJBqwitqKbp9hevaqrOj/3187MC/S7N+0Gimwb4f0rCIBIiWJKpqACuPjKvc9OCrrebs+55uhY4CLctP+gzXESSnwhnxACmwcEmilBKBIuDwowMc93srnVVfcGw/nevVrR1ebjXBufU5A/cIUgmugmJMqLJ1HXsRqIcJNCUP9Oc748sLQmXZScau10PvlXWFPSCoZJJNU8VgBHBUliVG79lWYdSmKJbBwSSLijTkPluK8OQNmFwUNvZkrlnZ0k8rDvQKoVyKh2tlTSAKWaxX+31F2VaUuJQVj3FDC4B4GCCtw3oXZGswKDeHdbB4sAIdTkFoU26ikZ4/WQ+KDZkgOnsolHEdw0zTeGGKAiABIyAE9eI6RYRKJqK0H4QXrQwQcqh1cCYpgkAAgLGMGHaoNRZH9GUPGSOgJzePAREMPXPGE6eDVZSlfgyZ+RkSCKO2B2JN4b6GUNkmIhbc8rys126JGIIfTGzoaMXOaNpfp7CNAKYMybD8Ts2zPvOzZdLpThj3/nPXd/8/RuGLyM6ELly0cwXvnSLSxMEhIC3/uy5ujOdmteQH0SDQYbIEBWQnBY9aJOqov1ZHiKwFXEGb9a1geDxuFnu9z121waXJgAAAV85duaJ7ceExwACp5MdEahkIU0EtmmBZYNgwmWo1G9hKZL14Ag4q/XnIILOeThhHmnvRs40ho9/4UZ/ljdhy7sffSXQFznU3o2CA4CVsEApAADGmJ6k+zQ4zi4pvKKmdP3Cym88vf1QU0gYWkrDnIwHhwC2JN1j1PhzHHt8sqM31Bch0/7p3RtXziwGgPv+/fVfvbAH3AYIzjVhS7m0qjg/wwUAocHYgeYQY5O700MwZkZi99+27i/XLwOAuGXf/suXQLBU73CYFIARybbL8n0zcjIVEUM80ByyQ31fuX3dHZfOB4B/2XLgZy/uNfKyFBERSEU658/cc2NZTiYA/Gzrwc///AWe5bHlJDpdDozVfh8A2Eq9Wdfa1x8WbkOp1AaYJQVgAEvOK87VBXdA2nzw1Mpltf/00SsAYMvJlvseeVXzumylpCJEINNaUlHooAsA2+rbAM8tqcPRB4leCJFKoa6V5WQSgGBs75kg2or9t74DpxLXnqQVDEotrfQ7mnAwbiYs+w/3bELE5u6BT/zrZoUMGZIiAFBETOOtveGP/OApp9D5naYgdxsKyHnciAhAtiKSxDkbMvAAnJ3V1duBxnmHRl0z8ubZa5ekrfKz3FUF2Q42u08HgbN3Rz6beUNERUOmefQkQEQCciaxxpmioe9liIhwvilPgnVPBsCOh7Wswg8AjOFALPHAravLcjL6Y4mP/WRzsDeseVxSqXdZLMbaOnrbWjqdAAvcBkgJIxXvpgQGwmO4XdpgNAEATOMIaEUTgAgMh4gwpYAxGN6LyDTBGFrRhIPJ2SQa6C5D2latP8fncQFA1LR2NLY7wyCiFYkDQ0AERcAYAIAtwa0zhkNe94iYNnBmeF0AlIgkQHCmcY5oJWywbRAcFL2LMwLoGmM4qVZ+0gFGAFsqV4Zr0YwCZ86W5mSW5mQSkSXVyWAvMzQ1jC4iKlvmZbof+/LNHl1jAG/Wt3396e2bv/TRTJeOAO+c7tjfFPzostqaopxst3Gyo/fTv3qxpScsbeuWVXPuWrPIrQlEzHBp+5tDJ9q7Ny2pVkRS0W2/eLG1rWvjqjl3rl5YlOXRNIHD7pMt5W2/fLGufnBFpX9IVwM+dfcNgf7I7b94MRaN/+nqBZ9cObcw02PoYiCaUEA7Gtr//o+7InGrNC/zt5+7TnDGADcfOhXsC//Jitmzi3IJ4FBL59ee2NbY2W9ZVlVRztc2rJhbnOvRNV1whqhIAcG/bTvywxd2ax5DTpqlF0nQz2TaNaV5jnlDREdrKYL8DPe18yv+8NYxPcNtK+UsLWnZC0rz1s2tcP78haNnSnze6xbMdF5eWl3aG43neFzOyxJfxrc3XfKZHzxzxbKaJ+++ceRLGzt6Pn3ZgpGXgf5IW1f/P92+7qvXrwCAqGU3d/YzhpJIIO5r6T0d6gNdrKoqcTSxWxeXVpe+fOxMrHvgR3dtuGfdEgAIDEROtHaunVcJAFfUlOV4XHf95LlsT/6Vc8qH7q2mNNA7WDzsOlQV+Jp7Br/0r89tXLPwkTuvd+65IdTb1NUfGoybtj0zP3t7QztM8kb/SQeYIYItl5YXMkRbKcGYYx6JFABuXDTrD28dPctaS3VxhV8qMm1paPz5w6cuLh9+Kfh/7D7x6Z88V1NRuPWrt2a5DQScmZ+NpO64bD4AmLYciJsbHnr6nUOn1y6vefnLH5OKBGdP7Dm5bkHFV69fQUR1wd41//hYsCcCYlg3EoEmdK/LMSKCsbseeWVnfWtbd/jj6xbfs24JEb1xsuXGHzwdDvV968+u+dYNlwDQ+gUVoIvCLI8isqViDD/7m5cfeWnv7ddc/JvPXmfaSnA80taVX5L7+N03uDUhFX31ia0P/nEnMAZSOb35QNeYLibVEieFQCBaVVXsEJYtPQNNXf2X185wPrl6XoU32xs1baczAxEA4vJKP2fo0kTCto+0dt+6bDZnqAmmgL79x50JSSc7egdiZq7XDQD7zoRIiBUziwBAF/yNEy3vHGmCTE9DsF8RaYIxxG11bdfOr3AitKf31QeD/Z68TNtWw3ktMONmbUluZX42AEQS1pP7Gro7B4RH/84tlzv43fvvW8Jxk2dnbG9o5wwBMJKwwZYLSvIYoi74nqaOR7YeBkM/0dHDEHXOGMOtda03LKtxa4KIOgYiP3r9oPA6lgcByJJKTb6XNelhkq0UuvQVM4sde7y/OfR3z72NAAioiEp9GZdWFVPCYgwd+yfc+kUzChw3+FigJxaOrZxV5Cyslu6B1t4wcja3OLc8L8uxW1vrWrMKsmr9Oc6z2nkqwDQBtlw0I18X3Fmjb5/u8OiaIlJEeRlusOzoYNSMxs1wzAzHCABsuWpWseNjnwj09EXiTLBrF1ZWFfgY4junA0fPhFwel7Rtn8cYVvthNO2VM4uclzsa2pEIgS6tLhnyJeOJ06F+x8dWBKYtbaXsSCw6EI32haP9UTspDJmYbP1sW/aM/Kw5RbnOAjrc1v3agVOB/nBxdoZpS13wTYurXtnbgIgMwbbs8kLfrAKfc/GOhjami/kl+c5oxwI9sagJUi0pLxzJB+w8FVg5s9iJsBnHt08FFOdg2c6aZgzbegdbOnrDCUswBgB3rl5U4/fFLRk1LSLa3hD4l9cPAMCVs4eUyu6mDpmwgOj6BZUEgAC7TgXQkgwRFC2eUTB0M+09pIvlwwDvbwk5aC2r9DvvHG/vsRPWi4dOd4djeRnumfnZ+771yUBvuC+W6ArH9zeHfr/rhDX51S2TC7BDcSwpL3DrwpKKcdzd1EHh2B/21N277mLnmo8smuXKdCdspXEGllxYmmcI7mD/xsnWikJfrtdlSyU4298cAqkA4ZKqYmf2nO7u7wz2rVm3BAAEZ13h2NFADwpOSo2srV2nAqDUPz6/2xB8dW2pIcSMnMy8TI/PbQDAR5fOrg/1Pben/oqa0nevJ0JDW1ZZ5KjwhlA/OTGr4JdUlTiXbW9oyy3Mrir0OXHg/uZOYEzoYvGMQueCfc1BIGrrDa9/8A/f+/iV5bmZRVne6sKcDENzLphZkPWtx94ccTBTFGAEpS6rLgEAwTCSsPaeCYHH9eiuE/dctUTjTBHNzM9eVV38xqEmnuEGpZwVwBkjoh2N7atrygBAEgmAAy2dAMAMbVnlEHh7zwTBsp3xAeBwa2dffwR1LTPTvWj4QW+rbwOAQdP+8iOvgi6AIUjlAnz4LzbecnENIORnuMuLfOV5WQ5UB1o6GWNZHqMyP8sZITgQAcYsW+b4vIvLCxxT8tqJljW1ZY5WaO+PNHb2A0JpTkZ1oY+IEHFPUxAUGS5976ng2n963GVokoiZ1s8+d/0nV85FxCtnzwDBJltPT64NlopAE86sR8Sj7V1tXQMiw7W3MbD3TBARLakA4GNLa8GxqJwNA4ytvYOBYN+lQ5ODSaWOB3qc0GhOUa4Ta22ra8MM18KyIR2+o7FdEDBFtX5fcbbXuWbXqQATQhfMneUxdE3nwutxx8Px5p4BwZlgrC7Yu3ZYPzd29h1u7VJSZbuNbLdBQ+yFFLqQ0cSGhZV5XjcR7WkKdrV1b1w0y/mrI21d4UgcFM0vyXNpQ1vMDrZ0oiYQwOUxDEOziThjpqUe3nFMcDZcoZTKvSoRQdqyIMe7qKyAiAhgZ2OAEpbOuUpYv911fJh3hE2Lq7zZ3oRpezLcC0rzh21hEEx7BO+2vvCZnkEgWlCa5zU0pxbgrYa22aX5OR6XaUtFVNfRaw9GZe/g9QsrncED/eGjgR4FEOuLxPoiiYGoGY5GQr2za0ruuGyBE30daum8fuFMIlJElq3KfN7K0jyHgXS83LLcTDvUl5Pj/ebGVbZSiPj91/aDLlbXlhIBEe1p6gBbgaJllX4iYgjBgUh9Zz9xFu+PxPsjiYGoPRiLD0YpEl8yo0AqYoh7zoTAshlOLsZiUj0sadmLygqy3IYTxW5vaANEqRQY2pP7Gr5zy+VuTVhSleVkrl9Q8dQbh2vml5f4MiypOMNtdW3odc0pGnKPTwR6IpE4ACyv9Dsu2EAscaSt+/KaUidQAYD/c91yIdXiquI7Vy9yYu6DLZ3hzv5lC2Z+9vL5isjx1VHSzctr8zPcAPC9l/aGw7Gr5sxARASYW5J35oE/f+7QqZseeKKtL1xV4AOAr123Il+IT165aHZRLgC8cbLl8TcOLZ5dVl2Y48zkPU1BYAgIq2YVO1O2Ltg70Bfx+TI+dfUSxzlHRClVaY733nUXc4YnOnr+4Y87mVuf7KoVMbkGWKpr51cggCE4Ee1uCoIupCJN11oDPa8cbbppSQ3jCABfWb/s6a2Hl1X6HavmxD/zZuQ7wS4AHG7tAkuCxtfOmeHM+uOBbjOW2N8U3NHQXlWQbSlVnO39/qeuae8blIp0gQDwVn07Krr/5kvWz585+t4SlhXoC/9i2+G/eWYncv70/oY/WVYrpRKMhU3rey/slpa893ev//RTV+e4jdIc73c+sZaIBuKJLcdb/vzhl0HRlbNLI3HTlEqSOtrezQX3ePTK/Kxw3OQMd5/ugHDs1quXPPSJtec8lphpbT7YeNevX+4cjItJZjkAANmd3588FlopNbckz8nbxy2598xQLIGIZMvi3IyqgmxFQyWz2xsDpb6MyrxM5yfvPNXh8+jzinKdPFJDqD/QG0bOLi4v8OgCAIID0fqOPgXAGXoNoRQQUCJmlhVmn/j7OwwhAOHKBx7fergpM8sTjpuCM4fQHoybAGCaFsRtluVRUkI4nlWQpXPGGQv2hcFW3OuSsURGhtspBRyIJaQiRWSF4+AxgABIZbl1j0uPJqyB3ohjTPPysgyNxxJWbzTBELPcetyyAVAReXUNEWKWjQDR/igYmtBFEpLNkwjwUEbMssHpP4fAhiME56WyFVhyuP85MZeubAn2UMzAXJpSCszhCzTOBAMCZVrgXMIZ07iThnOeFOdMhmO3rb3o0c9dDwC9kfisv/qlYLhiVrHPYwT6I1uOtwDAFbWlhVmeTJe+rb7tdKDHl+29orp4d1OovWsANX7NvPL9LZ1d/VGhcctWTknY8uri8txMj64dau082NiRn5tx7fyK/S2dxxvay2YUXD6rOGxaWS59W31bS6BnwaziDEPb1dhemO29qCw/krCyXPqe5pAl1dyi3AyXHjWtt091JKeQYNKpSqFrI27EWTkTAi440/hol5trgumjXjLGPHw4dTqUWxWGPpLrVcPZVsaRADTGiOG7UVNbZ1+ob8Nl85774s2bDzTcsLj684++8vOX9j5/301tveEdJ1uPB3oaI/Gb1iz85R3r/3XLgXt+/kKuz7P5i5uuefCpN7sGSOOcI0duxc2HP7OeIxw83dEbibV49Lf+6uOvH2/+51tXb/zB09ku/Xu3ri7NyTzUEuoejHaE+rZ85WP5GZ7Mv/jhwpK8Rz6zvsiX2RDs+ewvX1xUWfTgx9dsO9lytKN3R10b1wRNg3ywGn+bAhGd01vynHfonDkx1oBy6IwzQMS4soGz1bVlzlDbG9rBkgRgK/WtZ3csLvfnZbhJyphl72gM/OKNg83hOHC+fn7l/jPBJeWFzOtK2LIvatpq5FwtUEBEKmHLN060PLzlYGskXlCQPbso98uPbfnZ6/tDMWvvybabfvzsrm98csMPn209E7rk4qpw3OqL9ty8vPbR/3znpoS54+t/+pEfPlt/rHntgsq6jp7P/NsLShOMc6J0O+H3EYllurRMl8h0CV2gkOqudUtqi3IStkTEHY0B4EwpYoiPfO76vAzXi0ea0NAjCeuWpTX/fu9Ntf4cbmiXVpd876U9/izPvLK8mGlrHDkiw1HhC2Mx0/7UpfOf/NIttyyrPXmi9b7fv/7o5z7yyJ9vLMv2IIBb1zjDHK+BSl03v2LvmeATu+tuWlyFRIJzhujRNRQ8Ylqzi/J2fvv2f7ltnZISEaeDip4k4QytmLmytvSl//1RWypAiCRshuBUcgkGZ7r7d9S3gaE5C/Giv3n0ic9vvKKmdN/RMz6P6/7ndn7vP94Er/uiWUVF2d7/e+OqiryslTOLDp8JAkA4bqpoQuliKEiVKsul37955/effAsy3BVVxYiY/4UftT509/+5fvnH9zUgglRKKiLOLppRsLqm9NLqknDcIq/LVmQrRUSklFfXDrQEl3/9N+A2RuqB0it4giwkZHmMcNyURIKxXI+R6dJOd/Xvbur48Wv71373id5IAhjjDDlDUhA1rSXlfifB9Y0Nq44/9Bf3rl/q0I03PvDE73Yd+/TlCxDREPx3d16/4x8+vaamRDlpLoaWUn+z6dK6H33h15+7bqA/8o0bVu769m0aZ7/fdQJ0jSNyxmyp9GzPpsXVD+84tumhp2v8OXNnFsUtWzDmZBiJaFll8Vt/e/tbf/3xUl+G+u8W9U0tL3py7x6AM9Q4c/rAKyJLUty0IGGBrgldSEvmZ7mXzCh49URrrd/n0cX+ptBlNcU+j2EIfryjlyEWZXtf3dfo9/sWlORurWu7rKo412sIxnY0drT3hrngUqllFYVFWW6N885wbNvxluwsz9rZZccDPSdbu1Hwgiz3tfMqnjnQqIg2Lpq59WRbMNi7YeWcg62d0YT1v5bXPL6nobsvMqc8f2VlkcfQpKLHdp8ciJps8rsKpzbAYzhxCJwhR+ZkfwFBSQWmzVy6siQQMUNTcXOo+M3x4aUSHsO2JFg2c+kqYYFTgG1oTmAGAMq0QSogAs64S5dSQtwCTThMhVIEcRPcOgJQzASXJoSwI3HQBSBCLAFug3GmLBtMCxQBIHgNlhQbnPIA4zmM/Xk+OyIwRIf+dSYEHy61dIwgIkhFTkJaqnc/darwR2jX0bGZM+ZInIYAnDEn6ycYk0RExBk6k48zJpWi4W1tI3UQyXk+Kd9l55yK5bGCMZBDZX40Rjg+/OcjEdqYBY7n6ImRMUcGGAFs5D8j44y8M6RUkivpTnfTXNIApwFOSxrgtKQBTksa4LSkAU5LGuC0pAFOA5yWNMBpSQOcljTAaUkDnJY0wGlJA5wGOC1pgNOSBjgtU03+P4AjHAyt3sIpAAAAAElFTkSuQmCC";

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CITY_AREAS = ["Constantia", "Camps Bay", "Green Point", "Rondebosch", "Milnerton", "Fresnaye", "Sea Point", "Claremont"];
const PROPERTY_TYPES = ["House", "Apartment", "Townhouse", "Cluster", "Vacant Land"];
const PRIORITIES = ["Good schools nearby", "Sea/mountain view", "Move-in ready", "Secure estate", "Space for a home office", "Pet-friendly garden", "Off-street parking"];
const MOVE_REASONS = ["Upsizing for a growing family", "Downsizing, kids have left home", "Relocating for work", "Wants to be closer to family", "Investment purchase", "First-time buyer"];
const AGENCIES = ["Pam Golding", "Seeff", "RE/MAX", "Rawson", "Chas Everitt", "Not listed with an agency"];

const NOTE_TYPES = ["Call", "Email", "WhatsApp", "Viewing Booked", "Viewing Feedback"];
const FOLLOWUP_OPTIONS = [
  "Catch up on search",
  "Call",
  "Book in for appointment",
  "Call to set up meeting/viewing",
  "Call to set up valuation",
];
const OFFER_QUICK_NOTES = ["Call", "Set up meeting", "Email sent", "Left voicemail", "Awaiting response", "Sent counter offer"];
const OFFER_FOLLOWUP_OPTIONS = ["Call", "Set up meeting", "Follow up on counter offer", "Check in with attorney", "Other"];
const OFFER_FIELD_LABELS = {
  property: "Property",
  suburb: "Suburb",
  askingPrice: "Asking Price",
  offerMade: "Offer Made",
  conditions: "Conditions",
  sellerCounterOffer: "Seller Counter Offer",
  buyerCounterOffer: "Buyer Counter Offer",
  agreedPrice: "Agreed Price",
  buyerName: "Buyer Name",
  sellerName: "Seller Name",
  listingAgent: "Listing Agent",
  sharedDeal: "Shared Deal",
  sharedWithAgent: "Shared With",
  sharedSplit: "Split",
  comPercent: "Com % ex VAT",
};
const REQ_FIELD_LABELS = {
  maxBudget: "Max budget",
  cityPreference: "City/area preference",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  garden: "Garden preference",
  propertyType: "Property type",
  topPriority: "Most important requirement",
  reasonMoving: "Reason for moving",
  bestSeenSoFar: "Best seen so far",
  hasPropertyToSell: "Has property to sell",
  sellingOnMarket: "Property on market",
  sellingAgency: "Selling agency",
  sellingMonths: "Months on market",
  sellingPrice: "Asking price",
  hadValuation: "Had valuation",
};

const LISTINGS = [
  { id: "L1", ref: "PD-10234", address: "12 Vineyard Close", suburb: "Constantia", price: 8950000, type: "House", beds: 4, baths: 3, parking: 2, status: "Active", agent: "a3", portals: ["Property24", "PrivateProperty", "Website"] },
  { id: "L2", ref: "PD-10241", address: "4 Harbour View, Unit 8", suburb: "Green Point", price: 3200000, type: "Apartment", beds: 2, baths: 2, parking: 1, status: "Under Offer", agent: "a1", portals: ["Property24", "Website"] },
  { id: "L3", ref: "PD-10256", address: "88 Kloof Road", suburb: "Camps Bay", price: 15500000, type: "House", beds: 5, baths: 4, parking: 3, status: "Active", agent: "a3", portals: ["Property24", "PrivateProperty", "Website"] },
  { id: "L4", ref: "PD-10260", address: "22 Rondebosch Ave", suburb: "Rondebosch", price: 4650000, type: "House", beds: 3, baths: 2, parking: 2, status: "Sold", agent: "a2", portals: ["PrivateProperty", "Website"] },
  { id: "L5", ref: "PD-10271", address: "6 Milnerton Ridge", suburb: "Milnerton", price: 2350000, type: "Townhouse", beds: 3, baths: 2, parking: 2, status: "Active", agent: "a4", portals: ["Property24", "Website"] },
  { id: "L6", ref: "PD-10288", address: "9 Signal Hill Rd", suburb: "Fresnaye", price: 11200000, type: "Apartment", beds: 3, baths: 3, parking: 2, status: "Active", agent: "a1", portals: ["Property24", "PrivateProperty", "Website"] },
];

const DK_STATUSES = ["Uncontacted", "Number Requested", "Contacted", "Listed Buildings"];
const DK_STATUS_CLASS = {
  "Uncontacted": "dk-grey",
  "Number Requested": "dk-gold",
  "Contacted": "dk-green",
  "Listed Buildings": "dk-purple",
};
const DK_STATUS_SUBTITLE = {
  "Uncontacted": "Imported records to work",
  "Number Requested": "Waiting for contact details",
  "Contacted": "Positive contact made",
  "Listed Buildings": "Listing active",
};

const DEAL_STATUSES = ["Yellow", "Blue", "Silver", "Gold"];
const DEAL_STATUS_CLASS = { Yellow: "deal-yellow", Blue: "deal-blue", Silver: "deal-silver", Gold: "deal-gold" };

const SPLIT_OPTIONS = ["90/10", "80/20", "70/30", "60/40", "50/50", "40/60", "30/70", "20/80", "10/90"];

// Labels offered when creating a new contact from the Purchaser/Seller
// picker on an offer or deal — distinct from the general Contacts page's
// category list, which also covers canvassing/lead/attorney-sourced rows.
const PARTY_CONTACT_LABELS = ["Purchaser", "Seller", "Landlord", "Tenant", "Purchaser and Seller"];
const RENTAL_DEAL_STATUSES = ["Active", "Completed", "Fallen Through"];

// Manually-created tasks (the "+ Add task" flow) get one of these kinds;
// system-generated ones (viewing-feedback, otp-send, etc.) keep their own
// values, handled separately in todoKindLabel below.
const TASK_KIND_OPTIONS = [
  { value: "followup", label: "Follow-up" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "paperwork", label: "Paperwork" },
  { value: "viewing", label: "Viewing" },
  { value: "admin", label: "Admin" },
  { value: "other", label: "Other" },
];
// Suspensive conditions checklist per deal — each one tracked
// independently (type, who's responsible, due date, fulfilled or not)
// rather than one free-text blob.
const CONDITION_TYPE_OPTIONS = [
  "Bond Approval", "Sale of Buyer's Property", "Property Inspection",
  "FICA / Compliance Documents", "Attorney Sign-off", "Other",
];
const CONDITION_ROW_STATUSES = ["Outstanding", "Fulfilled", "Waived"];

function todoKindLabel(kind) {
  const system = {
    "viewing-feedback": "Viewing feedback", "meeting-feedback": "Meeting feedback",
    "otp-send": "Offer to Purchase", "canvas-number-request": "Canvassing lookup",
    "canvas-call": "Canvassing call", "merge-review": "Lead merge review",
  };
  if (system[kind]) return system[kind];
  const manual = TASK_KIND_OPTIONS.find((o) => o.value === kind);
  return manual ? manual.label : "Follow-up";
}

// --- Marketing ------------------------------------------------------------
const MARKETING_PLATFORMS = ["Meta", "Google Ads", "LinkedIn", "Listing Portals"];
const MARKETING_SECTORS = ["Commercial", "Residential"];
const MARKETING_STATUSES = ["Planned", "Live", "Paused", "Ended"];
const MARKETING_AREAS = ["East Rand", "Rynfield", "Northmead", "Brentwood", "Farrarmere", "Benoni AH", "Van Ryn"];

// Attorney firm and bond-through options for the Deals table — searchable
// with free-text fallback, so anything not listed can still be typed in.
const ATTORNEY_OPTIONS = [
  "Hammond Pole", "Young Law", "Jan Jordaan", "Tuckers", "Du Plessis Van Loggenburg",
  "STBB", "Rorich Wolmarans & Luderitz", "Biccari Bollo Mariano", "Macrobert Inc",
  "Friedman Scheckter", "Van Velden-Duffey", "Tim du Toit & Co", "Rossouws Attorneys",
  "Van Hulsteyns Attorneys", "Strauss Daly", "Schindlers Attorneys", "Rademeyer Attorneys",
  "Boshoff Visser Inc", "Adams & Adams", "Werksmans Attorneys", "Vezi & De Beer",
  "De Klerk & Van Gend", "Denoon Sampson Ndlovu", "Woodhead Bigby", "KVV Inc.",
  "Benaters", "Boqwana Burns", "Barnard Inc", "Snyman De Jager", "Malan Scholes",
];
const BOND_THROUGH_OPTIONS = [
  "NA", "Multinet", "Ooba", "Betterbond", "Standard Bank Direct", "Nedbank Direct",
  "ABSA Direct", "FNB Direct", "Investec Direct", "SA Home Loans", "OTHER",
];

// Deal condition status — where the deal sits (distinct from the agent tier).
// "Above the line" counts toward Confirmed. "Fallen through" is pulled out of
// the pipeline entirely and tracked as its own per-agent total. Every other
// status rolls up into Suspensive.
const CONDITION_STATUSES = [
  "Above the line",
  "Suspensive Bond",
  "Suspensive of Bond and Sale",
  "Full Cash awaiting Cash",
  "Suspensive of Sale only Cash from Proceeds",
  "Fallen through",
];
const CONDITION_GROUP = {
  "Above the line": "Confirmed",
  "Suspensive Bond": "Suspensive",
  "Suspensive of Bond and Sale": "Suspensive",
  "Full Cash awaiting Cash": "Suspensive",
  "Suspensive of Sale only Cash from Proceeds": "Suspensive",
  "Fallen through": "FallenThrough",
};
const CONDITION_CLASS = { Confirmed: "cond-confirmed", Suspensive: "cond-suspensive", FallenThrough: "cond-fallen" };

// Commission waterfall per agent tier — confirmed from the tier chart:
// 5% marketing fee, 10% listing commission on every tier; agent share rises with tier.
const COMMISSION_FORMULA = {
  Yellow: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.25, confirmed: true },
  Blue: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.35, confirmed: true },
  Silver: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.40, confirmed: true },
  Gold: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.45, confirmed: true },
};

function computeDealCommission(deal) {
  const formula = COMMISSION_FORMULA[deal.dealStatus] || COMMISSION_FORMULA.Yellow;
  const gross = Number(deal.confirmedCommission) || 0;
  const afterMarketing = gross * (1 - formula.marketingFeePct);
  const listingFee = afterMarketing * formula.listingFeePct;
  const afterListing = afterMarketing - listingFee;
  const sellingPool = afterListing * formula.agentSharePct;
  const nettToKingstons = afterListing - sellingPool;
  const listingAgentId = deal.listingAgent || deal.agent;

  let sellingSplits;
  if (deal.sharedWithAgent && deal.sharedSplit) {
    const [p1, p2] = deal.sharedSplit.split("/").map(Number);
    sellingSplits = [
      { agentId: deal.agent, amount: sellingPool * (p1 / 100) },
      { agentId: deal.sharedWithAgent, amount: sellingPool * (p2 / 100) },
    ];
  } else {
    sellingSplits = [{ agentId: deal.agent, amount: sellingPool }];
  }
  return { listingAgentId, listingFee, sellingPool, sellingSplits, nettToKingstons, formulaConfirmed: formula.confirmed };
}

function aggregateAgentCommission(dealsList) {
  const totals = {};
  dealsList.forEach((d) => {
    const { listingAgentId, listingFee, sellingSplits } = computeDealCommission(d);
    totals[listingAgentId] = (totals[listingAgentId] || 0) + listingFee;
    sellingSplits.forEach((s) => { totals[s.agentId] = (totals[s.agentId] || 0) + s.amount; });
  });
  return totals;
}

// Splits a deal's raw gross amount (e.g. Confirmed Commission) between the
// primary agent and the shared agent by the sharedSplit ratio — used for
// pipeline/leaderboard attribution, distinct from the take-home commission
// split in computeDealCommission (which applies after marketing/listing/tier).
function splitGrossAmount(deal, amount) {
  if (deal.sharedWithAgent && deal.sharedSplit) {
    const [p1, p2] = deal.sharedSplit.split("/").map(Number);
    return [
      { agentId: deal.agent, amount: amount * (p1 / 100), isPrimary: true },
      { agentId: deal.sharedWithAgent, amount: amount * (p2 / 100), isPrimary: false },
    ];
  }
  return [{ agentId: deal.agent, amount, isPrimary: true }];
}

const MONTH_TO_Q = { Jan: 1, Feb: 1, Mar: 1, Apr: 2, May: 2, Jun: 2, Jul: 3, Aug: 3, Sep: 3, Oct: 4, Nov: 4, Dec: 4 };
const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Month dropdown options for Offers/Deals — last year through next year,
// so agents can log something slightly late or plan slightly ahead.
const MONTH_OPTIONS = (() => {
  const thisYear = new Date().getFullYear();
  const years = [thisYear - 1, thisYear, thisYear + 1];
  return years.flatMap((y) => MONTH_ABBRS.map((m) => m + " " + y));
})();

function parseDealMonth(monthStr) {
  if (!monthStr) return null;
  const parts = monthStr.trim().split(" ");
  // Normalize through the same alias table CSV import uses (defined below,
  // safe to reference here since this only runs later, well after module
  // load) — catches rows already saved with a locale-mangled abbreviation
  // like "Sept" from before that was fixed at the source, so old data
  // self-heals here instead of needing a DB migration.
  const mon = IMPORT_MONTH_ABBR[(parts[0] || "").toLowerCase()] || parts[0];
  const year = parts[1] || "";
  return { mon, year, quarter: MONTH_TO_Q[mon] || null };
}

function monthLabelToDate(label) {
  const p = parseDealMonth(label);
  if (!p || !p.year) return null;
  const idx = MONTH_ABBRS.indexOf(p.mon);
  if (idx < 0) return null;
  return new Date(Number(p.year), idx, 15);
}

// Best available creation date for a deal/offer: a real logged timestamp if
// one exists, else the middle of its recorded month as a fair approximation
// — keeps KPI aggregation working for historical/imported/mock records too.
function recordCreatedDate(record) {
  const created = (record.activity || []).find((a) => a.text === "Deal created" || a.text === "Offer created");
  if (created && created.timestamp) return new Date(created.timestamp);
  return monthLabelToDate(record.month) || new Date();
}

function getKpiPeriodRange(mode, offset, now) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (mode === "week") {
    start.setDate(start.getDate() - start.getDay() + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return [start, end];
  }
  if (mode === "quarter") {
    const curQ = Math.floor(now.getMonth() / 3);
    const targetMonth = (curQ + offset) * 3;
    const base = new Date(now.getFullYear(), targetMonth, 1);
    const end = new Date(now.getFullYear(), targetMonth + 3, 1);
    return [base, end];
  }
  if (mode === "year") {
    const base = new Date(now.getFullYear() + offset, 0, 1);
    const end = new Date(now.getFullYear() + offset + 1, 0, 1);
    return [base, end];
  }
  // month
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return [base, end];
}

// Confirmed-group gross commission actually achieved by one agent, by month,
// for a given year — this is what a target is tracked against.
function computeAgentActuals(deals, agentId, year) {
  const byMonth = {};
  MONTH_ABBRS.forEach((m) => { byMonth[m] = 0; });
  let total = 0;
  deals.forEach((d) => {
    const p = parseDealMonth(d.month);
    if (!p || p.year !== year) return;
    if (CONDITION_GROUP[d.conditionStatus] !== "Confirmed") return;
    const gross = Number(d.confirmedCommission) || 0;
    splitGrossAmount(d, gross).forEach(({ agentId: aid, amount }) => {
      if (aid !== agentId) return;
      byMonth[p.mon] = (byMonth[p.mon] || 0) + amount;
      total += amount;
    });
  });
  return { byMonth, total };
}

// Managed-deal headcount per rental agent — a count, not a Rand split, so
// (unlike computeAgentActuals) a shared deal counts once for the primary
// agent only, not fractionally split by percentage.
function computeRentalAgentActuals(rentalDeals, agentId, year) {
  const byMonth = {};
  MONTH_ABBRS.forEach((m) => { byMonth[m] = 0; });
  let total = 0;
  rentalDeals.forEach((d) => {
    if (d.agent !== agentId || !d.managed || d.status !== "Completed") return;
    const p = parseDealMonth(d.month);
    if (!p || p.year !== year) return;
    byMonth[p.mon] = (byMonth[p.mon] || 0) + 1;
    total += 1;
  });
  return { byMonth, total };
}

// Gross Finder's Fee actually earned by one rental agent, by month, for a
// given year — Rand, split the same way as Sales (splitGrossAmount reuses
// deal.agent/sharedWithAgent/sharedSplit, which rental deals share the same
// field names for). Only Completed deals count — mirrors computeAgentActuals
// only counting Confirmed sales deals. Unlike computeRentalAgentActuals
// (the managed-deal headcount), this is not gated on d.managed — Finder's
// Fee is earned whether or not the deal is a managed rental.
function computeRentalAgentCommissionActuals(rentalDeals, agentId, year) {
  const byMonth = {};
  MONTH_ABBRS.forEach((m) => { byMonth[m] = 0; });
  let total = 0;
  rentalDeals.forEach((d) => {
    if (d.status !== "Completed") return;
    const p = parseDealMonth(d.month);
    if (!p || p.year !== year) return;
    const gross = Number(d.findersFee) || 0;
    splitGrossAmount(d, gross).forEach(({ agentId: aid, amount }) => {
      if (aid !== agentId) return;
      byMonth[p.mon] = (byMonth[p.mon] || 0) + amount;
      total += amount;
    });
  });
  return { byMonth, total };
}

// Fixed-lookup "Mon YYYY" label for a Date — deliberately not
// toLocaleDateString(), whose "short" month varies by locale (en-ZA renders
// September as "Sept", not the "Sep" MONTH_ABBRS/MONTH_TO_Q key on everywhere
// else, silently dropping those records from month/quarter filters).
function monthYearLabel(d) {
  return MONTH_ABBRS[d.getMonth()] + " " + d.getFullYear();
}

function isoToMonthLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return monthYearLabel(d);
}

function sortByMonthLabel(arr, getLabel) {
  const order = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  return [...arr].sort((a, b) => {
    const pa = parseDealMonth(getLabel(a));
    const pb = parseDealMonth(getLabel(b));
    if (!pa || !pb) return 0;
    if (pa.year !== pb.year) return pa.year.localeCompare(pb.year);
    return (order[pa.mon] || 0) - (order[pb.mon] || 0);
  });
}

// Once "Registered" (the 17th transfer step) is ticked, the deal's actual
// completion date always wins over the original projected Exp Reg Date —
// whether it landed earlier or later than planned.
function getRegistrationInfo(deal) {
  const regStep = deal.transferSteps && deal.transferSteps[16];
  if (regStep && regStep.done && regStep.dateCompleted) {
    return { registered: true, date: regStep.dateCompleted, monthLabel: isoToMonthLabel(regStep.dateCompleted) };
  }
  return { registered: false, date: deal.expRegDate || "", monthLabel: isoToMonthLabel(deal.expRegDate) };
}

const MONEY_FIELDS = [
  "askingPrice", "openingOffer", "agreedOffer", "confirmedCommission",
  "suspensive", "fallOut", "kreNettConfirmed", "kreNettSus", "nettToKRE", "bondApplyingFor",
  "deposit", "occupationalRental", "cashPortion",
];

const TRANSFER_STEPS = [
  "Instruction received",
  "Seller contacted",
  "Buyer contacted",
  "Rates figures requested",
  "Rates figures received",
  "Sellers Existing Bond Cancellation Figures Requested",
  "Purchase Price Secured",
  "Bond granted to Purchaser",
  "Balance of purchase price received",
  "Transfer documentation signed by Purchaser",
  "Transfer documentation signed by Seller",
  "Rates clearance certificate received",
  "Electrical certificate received",
  "Transfer duty receipt received",
  "Lodged",
  "Prepped",
  "Registered",
];

function buildDefaultTransferSteps() {
  return TRANSFER_STEPS.map((label, i) => ({ key: "step" + i, label, done: false, dateCompleted: "" }));
}

const DEAL_COLUMNS = [
  { key: "otpStatus", label: "OTP Sent", type: "otp" },
  { key: "dealStatus", label: "Tier", type: "tier" },
  { key: "conditionStatus", label: "Deal Status", type: "condition" },
  { key: "transferProgress", label: "Transfer Progress", type: "transfer" },
  { key: "month", label: "Month", type: "select", options: MONTH_OPTIONS },
  { key: "suburb", label: "Suburb", type: "text" },
  { key: "askingPrice", label: "Asking Price", type: "money" },
  { key: "openingOffer", label: "Opening Offer", type: "money" },
  { key: "conditions", label: "Conditions", type: "text" },
  { key: "bondThrough", label: "Bond Through", type: "datalist", options: BOND_THROUGH_OPTIONS },
  { key: "bondApplyingFor", label: "Bond Applying For", type: "money" },
  { key: "att", label: "Att", type: "datalist", options: ATTORNEY_OPTIONS },
  { key: "listingAgent", label: "Listing Agent", type: "agent" },
  { key: "agreedOffer", label: "Agreed Offer", type: "money" },
  { key: "deposit", label: "Deposit", type: "money" },
  { key: "cashPortion", label: "Cash Portion", type: "money" },
  { key: "financeRequired", label: "Finance Required", type: "boolean" },
  { key: "occupationDate", label: "Occupation Date", type: "date" },
  { key: "occupationalRental", label: "Occupational Rental", type: "money" },
  { key: "buyerPhone", label: "Buyer Phone", type: "text" },
  { key: "sellerPhone", label: "Seller Phone", type: "text" },
  { key: "sharedDeal", label: "Shared Deal", type: "text" },
  { key: "sharedWithAgent", label: "Shared With", type: "agent-optional" },
  { key: "sharedSplit", label: "Split", type: "split", options: SPLIT_OPTIONS },
  { key: "comPercent", label: "Com % ex VAT", type: "percent" },
  { key: "confirmedCommission", label: "Total Commission", type: "computed-total" },
  { key: "expRegDate", label: "Exp Reg Date", type: "date" },
  { key: "listingFeeComputed", label: "Listing Fee (10%)", type: "computed-listing" },
  { key: "commissionDueComputed", label: "Commission Due", type: "computed-commission" },
];
const DEAL_COLUMN_MAP = Object.fromEntries(DEAL_COLUMNS.map((c) => [c.key, c]));
const DEFAULT_COLUMN_ORDER = DEAL_COLUMNS.map((c) => c.key);

// --- Excel import: header normalization + dedup -----------------------------
const IMPORT_HEADER_MAP = {
  month: "month",
  property: "property",
  suburb: "suburb",
  askingprice: "askingPrice",
  askiingprice: "askingPrice",
  openingoffer: "openingOffer",
  conditions: "conditions",
  bondthrough: "bondThrough",
  bondapplyingfor: "bondApplyingFor",
  bondamount: "bondApplyingFor",
  bondapplication: "bondApplyingFor",
  att: "att",
  coseller: "coSeller",
  cobuyers: "coBuyers",
  cco: "cco",
  agreedoffer: "agreedOffer",
  shareddeal: "sharedDeal",
  "com%exvat": "comPercent",
  compercentexvat: "comPercent",
  confirmedcommision: "confirmedCommission",
  confirmedcommission: "confirmedCommission",
  "confirmedcommisionexvat": "confirmedCommission",
  "confirmedcommissionexvat": "confirmedCommission",
  suspensive: "suspensive",
  "suspensiveexvat": "suspensive",
  fallout: "fallOut",
  "falloutexvat": "fallOut",
  krenettconfirmed: "kreNettConfirmed",
  krenettsus: "kreNettSus",
  netttokre: "nettToKRE",
  "netttokrestilltoregister": "nettToKRE",
  stilltoregister: "stillToRegister",
  expregdate: "expRegDate",
};

const IMPORT_TEXT_FIELDS = new Set(["month", "property", "suburb", "conditions", "bondThrough", "att", "coSeller", "coBuyers", "cco", "sharedDeal", "stillToRegister"]);

// Bulk Offers import — column headers, case/spacing-insensitive (matched
// via normalizeHeader). "Agent" and "Shared With Agent" are matched by
// agent name against the live roster, not an internal id.
const OFFER_IMPORT_HEADER_MAP = {
  agent: "agent",
  listingagent: "listingAgent",
  property: "property",
  suburb: "suburb",
  askingprice: "askingPrice",
  offermade: "offerMade",
  conditions: "conditions",
  sellercounteroffer: "sellerCounterOffer",
  buyercounteroffer: "buyerCounterOffer",
  agreed: "agreed",
  agreedprice: "agreedPrice",
  buyername: "buyerName",
  sellername: "sellerName",
  shareddeal: "sharedDeal",
  sharedwithagent: "sharedWithAgent",
  split: "sharedSplit",
  sharedsplit: "sharedSplit",
  "com%exvat": "comPercent",
  compercentexvat: "comPercent",
  compercent: "comPercent",
};
const IMPORT_MONTH_ABBR = { jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun", june: "Jun", jul: "Jul", july: "Jul", aug: "Aug", sep: "Sep", sept: "Sep", oct: "Oct", nov: "Nov", dec: "Dec" };

function normalizeHeader(h) {
  return String(h || "").toLowerCase().replace(/[^a-z0-9%]/g, "");
}

function excelSerialToISO(serial) {
  const ms = Date.UTC(1899, 11, 30) + Number(serial) * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function formatImportMonth(raw, fallbackYear) {
  if (raw === undefined || raw === null || raw === "") return "";
  const s = String(raw).trim();
  const abbr = IMPORT_MONTH_ABBR[s.toLowerCase()];
  if (abbr) return abbr + " " + fallbackYear;
  return s;
}

// Signature covers only the "source" spreadsheet fields, so app-added fields
// (listingAgent, sharedWithAgent, sharedSplit, dealStatus) edited after import
// don't cause a row to look "new" on a re-upload.
function dealSignature(d) {
  return [
    d.month, d.property, d.suburb, d.askingPrice, d.openingOffer, d.conditions,
    d.bondThrough, d.att, d.coSeller, d.coBuyers, d.cco, d.agreedOffer, d.sharedDeal,
    d.comPercent, d.confirmedCommission, d.suspensive, d.fallOut, d.kreNettConfirmed,
    d.kreNettSus, d.nettToKRE, d.stillToRegister, d.expRegDate,
  ].map((v) => (v === undefined || v === null ? "" : String(v).trim().toLowerCase())).join("|");
}

// Dedup key for bulk offer imports — agent + property + suburb. Two
// genuinely different offers on the same address by the same agent would
// collide and the second would be skipped as a false-positive duplicate;
// that's an accepted tradeoff for not requiring a separate ID system.
function offerSignature(o) {
  return [o.agent, o.property, o.suburb].map((v) => (v || "").toString().trim().toLowerCase()).join("|");
}

function parseDealsWorkbook(arrayBuffer, fallbackYear) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows
    .map((row) => {
      const rec = {};
      Object.keys(row).forEach((h) => {
        const key = IMPORT_HEADER_MAP[normalizeHeader(h)];
        if (key) rec[key] = row[h];
      });
      return rec;
    })
    .filter((rec) => rec.property && String(rec.property).trim() !== "")
    .map((rec) => {
      const out = { month: formatImportMonth(rec.month, fallbackYear) };
      Object.keys(rec).forEach((key) => {
        if (key === "month") return;
        let v = rec[key];
        if (key === "expRegDate") {
          out[key] = typeof v === "number" ? excelSerialToISO(v) : (v ? String(v) : "");
        } else if (IMPORT_TEXT_FIELDS.has(key)) {
          out[key] = v === "" ? "" : String(v).trim();
        } else {
          const n = Number(v);
          out[key] = v === "" || Number.isNaN(n) ? 0 : Math.round(n * 100) / 100;
        }
      });
      return out;
    });
}

function normalizeAddress(addr) {
  return (addr || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function isDuplicateCanvasRecord(existing, address, contactDetails) {
  const na = normalizeAddress(address);
  const nc = (contactDetails || "").replace(/\D/g, "");
  return existing.some((r) => {
    if (na && normalizeAddress(r.address) === na) return true;
    if (nc && nc.length >= 7 && (r.contactDetails || "").replace(/\D/g, "") === nc) return true;
    return false;
  });
}

function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "").replace(/^0/, "27");
}
function normalizeEmail(email) {
  return (email || "").toLowerCase().trim();
}
function findMatchingLead(leads, phone, email) {
  const np = normalizePhone(phone);
  const ne = normalizeEmail(email);
  return leads.find((l) => {
    if (np && np.length >= 9 && normalizePhone(l.phone) === np) return true;
    if (ne && ne.length > 3 && normalizeEmail(l.email) === ne) return true;
    return false;
  }) || null;
}

function genDoorKnocks() {
  const streetPool = ["Vineyard Close", "Kloof Road", "Rondebosch Ave", "Milnerton Ridge", "Signal Hill Rd", "Harbour View Rd", "Main Road", "Belmont Ave", "Upper Kloof St", "Camp Ground Rd", "Fern Walk", "Marula Drive", "Oak Avenue", "Protea Close", "Jacaranda Road", "Voortrekker Street", "Rietfontein Road", "Kingfisher Crescent", "Cedar Way", "Harmony Road", "Sunbird Street", "Camelia Avenue", "Beryl Street", "Amber Close", "Aloe Ridge", "Willow Bend", "Falcon Street", "Heron Way", "Magnolia Ave", "Lavender Lane"];
  const suburbPool = ["Rynfield", "Northmead", "Brentwood", "Farrarmere", "Crystal Park", "Beyers Park", "Morehill", "Lakefield", "Benoni AH", "Van Ryn", "Ravenswood", "Delmore Park", ...CITY_AREAS];
  const owners = ["D. Abrahams", "M. van der Merwe", "T. Ngcobo", "S. Petersen", "L. Govender", "R. Isaacs", "N. Daniels", "K. Adams", "P. Human", "W. Cloete", "B. Mahlangu", "C. Reynders", "J. Botes", "F. Ismail", "A. Pretorius", "S. Zulu", "H. Marais", "V. Naidoo"];
  const companies = ["", "", "", "", "", "", "", "", "", "J A ENGINEERING WORKS PTY LTD", "", "", "", "", "", "BASFOUR 3514 PTY LTD", "", "", "", ""];
  const notesPool = [
    "No one home, left a flyer in the postbox.",
    "Spoke briefly, said they're not selling right now.",
    "Owner mentioned they might sell in the new year.",
    "Very interested — asked for a free valuation.",
    "Tenant answered, owner lives elsewhere, got a contact number.",
    "Dog at the gate, couldn't get to the door.",
    "Owner asked us to come back after work hours.",
  ];
  const daysAgoDate = (n) => { const d = new Date("2026-07-08T09:00:00"); d.setDate(d.getDate() - n); return d; };
  const RECORD_COUNT = 300;

  const records = [];
  for (let i = 0; i < RECORD_COUNT; i++) {
    const street = streetPool[i % streetPool.length];
    const d = daysAgoDate(Math.floor(Math.random() * 20));
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + Math.floor(Math.random() * 14) - 3);
    const hasNumber = i % 3 !== 0;
    const status = i === 0 ? "Number Requested" : (hasNumber ? DK_STATUSES[Math.min(i % 3, 2)] : "Uncontacted");
    const company = companies[i % companies.length];

    // Realistic funnel: cold calls are the highest-volume activity, door
    // knocks meaningfully fewer, valuations rarer still, and listings rarest
    // of all — matching how few valuations actually convert to a listing.
    const noteCount = 5 + Math.floor(Math.random() * 6); // 5-10 notes per record
    const notes = [];
    for (let n = 0; n < noteCount; n++) {
      const roll = Math.random();
      const type = roll < 0.58 ? "Call" : roll < 0.85 ? "Door Knock" : "Note";
      notes.push({
        id: "dkn-" + i + "-" + n,
        text: type === "Call" ? "Cold call made" : type === "Door Knock" ? "Door knocked" : rand(notesPool),
        author: rand(AGENTS).id,
        date: daysAgoDate(Math.floor(Math.random() * 90)),
        type,
      });
    }
    if (Math.random() < 0.09) {
      notes.push({
        id: "dkn-" + i + "-listing", text: "Converted to listing PD-DK" + i + " and pushed toward Propdata sync",
        author: rand(AGENTS).id, date: daysAgoDate(Math.floor(Math.random() * 60)), type: "Listing",
      });
    }

    const valuation = Math.random() < 0.22 ? {
      date: daysAgoDate(Math.floor(Math.random() * 75)),
      agent: rand(AGENTS).id,
      price: 1500000 + Math.floor(Math.random() * 30) * 150000,
      pdfName: "",
    } : null;

    records.push({
      id: "dk-" + i,
      address: (10 + i * 3) + " " + street,
      erfRef: "T" + (10000 + i * 37) + "/" + (2003 + (i % 20)) + "; Erf " + (500 + i * 11) + ";",
      erfSizeSqm: 300 + i * 47,
      trxDate: "",
      sellPrice: i % 4 === 0 ? 0 : (2000000 + (i % 40) * 350000),
      marketingLink: "",
      suburb: suburbPool[i % suburbPool.length],
      x: 8 + ((i * 37) % 84),
      y: 12 + ((i * 53) % 76),
      ownerName: company || rand(owners),
      knownName: company ? "" : rand(owners),
      idNumber: "",
      age: "",
      ownerPhone: hasNumber ? "+27 8" + (1 + (i % 3)) + " " + (300 + (i * 11) % 900) + " " + (2000 + (i * 17) % 8000) : "",
      emailContactDetails: "",
      broker: rand(AGENTS).id,
      agent: rand(AGENTS).id,
      date: d,
      status,
      archived: false,
      noInfoObtained: false,
      numberRequestTodoId: null,
      followUpDate: followUp,
      notes,
      valuation,
    });
  }
  return records;
}

function genLeads() {
  const names = ["Sarah Nkosi", "James Botha", "Lindiwe Dube", "Pieter Smit", "Fatima Osman", "Ryan Adams", "Zanele Mokoena", "Chris Naidoo", "Emma Reyneke", "Thabo Sithole", "Kirsten Meyer", "Sipho Zulu", "Amanda Pillay", "Johan Kruger", "Precious Mahlangu", "Grant Fisher", "Naledi Molefe", "Werner Steyn", "Buhle Ndlovu", "Craig Bezuidenhout", "Palesa Tau", "Shane Govender"];
  const messages = [
    "Interested in viewing this weekend, please call.",
    "Is the price negotiable? Would like more photos.",
    "Can we schedule a viewing for Saturday morning?",
    "Looking to relocate for work, need to move within 6 weeks.",
    "Are pets allowed? Interested in the garden space.",
    "Would like a virtual tour before booking in person.",
  ];
  return names.map((name, i) => {
    const listing = rand(LISTINGS);
    const source = rand(Object.keys(SOURCES));
    const stage = STAGES[Math.min(Math.floor(Math.random() * 5), 4)];
    const daysAgo = Math.floor(Math.random() * 12);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const hasPropertyToSell = Math.random() > 0.4;
    const onMarket = hasPropertyToSell && Math.random() > 0.35;
    const primaryAgent = rand(AGENTS).id;
    const otherAgents = AGENTS.filter((a) => a.id !== primaryAgent);
    const collaborators = Math.random() > 0.5 ? [rand(otherAgents).id] : [];
    return {
      id: "lead-" + i,
      name,
      phone: "+27 8" + (1 + (i % 3)) + " " + (200 + i * 7) + " " + (1000 + i * 13),
      email: name.toLowerCase().replace(" ", ".") + "@mail.com",
      source,
      listingRef: listing.ref,
      listingAddress: listing.address + ", " + listing.suburb,
      price: listing.price,
      message: rand(messages),
      status: stage,
      agent: primaryAgent,
      collaborators,
      date: d,
      activity: [
        {
          id: "act-" + i + "-0",
          type: "System",
          text: "Lead received via " + SOURCES[source].label + " for " + listing.address + ", " + listing.suburb,
          author: null,
          timestamp: d,
        },
        ...(Math.random() < 0.85 ? Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, vi) => {
          const vd = new Date("2026-07-08T09:00:00");
          vd.setDate(vd.getDate() - Math.floor(Math.random() * 90));
          const viewingAgent = collaborators.length && Math.random() < 0.3 ? rand(collaborators) : primaryAgent;
          return { id: "act-" + i + "-v" + vi, type: "Viewing Booked", text: "Viewing booked at " + listing.address, author: viewingAgent, timestamp: vd };
        }) : []),
      ],
      requirements: {
        maxBudget: Math.round((listing.price * (0.85 + Math.random() * 0.3)) / 50000) * 50000,
        cityPreference: rand(CITY_AREAS),
        bedrooms: 2 + (i % 4),
        bathrooms: 1 + (i % 3),
        garden: Math.random() > 0.5,
        propertyType: rand(PROPERTY_TYPES),
        topPriority: rand(PRIORITIES),
        reasonMoving: rand(MOVE_REASONS),
        bestSeenSoFar: rand(LISTINGS).address + ", " + rand(CITY_AREAS),
        hasPropertyToSell,
        sellingOnMarket: onMarket,
        sellingAgency: onMarket ? rand(AGENCIES) : "",
        sellingMonths: onMarket ? 1 + Math.floor(Math.random() * 9) : 0,
        sellingPrice: hasPropertyToSell ? Math.round((2000000 + Math.random() * 6000000) / 50000) * 50000 : 0,
        hadValuation: hasPropertyToSell ? Math.random() > 0.5 : false,
      },
    };
  });
}

const fmtPrice = (p) => "R " + p.toLocaleString("en-ZA");
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.getDate() + " " + MONTH_ABBRS[dt.getMonth()];
};
const digitsOnly = (phone) => phone.replace(/[^\d]/g, "").replace(/^0/, "27");

function buildWhatsappLink(lead) {
  const msg = "Hi " + lead.name.split(" ")[0] + ", it's the team following up on your enquiry about " + lead.listingAddress + ". When would suit you for a viewing?";
  return "https://wa.me/" + digitsOnly(lead.phone) + "?text=" + encodeURIComponent(msg);
}

function buildOutlookLink(lead) {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  const iso = (d) => d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: "Viewing: " + lead.listingAddress + " with " + lead.name,
    body: "Property viewing for lead " + lead.name + " (" + lead.phone + "), listing ref " + lead.listingRef + ".",
    location: lead.listingAddress,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  return "https://outlook.office.com/calendar/0/deeplink/compose?" + params.toString();
}

function buildOfferMeetingOutlookLink(offer, dateStr, notes) {
  const start = dateStr ? new Date(dateStr) : new Date();
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  const who = [offer.buyerName, offer.sellerName].filter(Boolean).join(" / ") || "buyer/seller";
  const bodyLines = [
    "Offer meeting for " + offer.property + (offer.suburb ? ", " + offer.suburb : "") + ".",
    "Buyer: " + (offer.buyerName || "—"),
    "Seller: " + (offer.sellerName || "—"),
  ];
  if (notes && notes.trim()) bodyLines.push("", "Notes: " + notes.trim());
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: "Offer meeting: " + offer.property + " with " + who,
    body: bodyLines.join("\n"),
    location: offer.property,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  return "https://outlook.office.com/calendar/0/deeplink/compose?" + params.toString();
}

function PeriodPicker({ mode, setMode, quarter, setQuarter, month, setMonth, year, setYear, years }) {
  return (
    <div className="filter-bar">
      <div className="view-toggle">
        <button className={"toggle-btn " + (mode === "month" ? "active" : "")} onClick={() => setMode("month")}>Month</button>
        <button className={"toggle-btn " + (mode === "quarter" ? "active" : "")} onClick={() => setMode("quarter")}>Quarter</button>
        <button className={"toggle-btn " + (mode === "year" ? "active" : "")} onClick={() => setMode("year")}>Year</button>
      </div>
      {mode === "quarter" && (
        <div className="view-toggle">
          {[1, 2, 3, 4].map((q) => (
            <button key={q} className={"toggle-btn " + (quarter === q ? "active" : "")} onClick={() => setQuarter(q)}>Q{q}</button>
          ))}
        </div>
      )}
      {mode === "month" && (
        <select className="select" value={month} onChange={(e) => setMonth(e.target.value)}>
          {MONTH_ABBRS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      )}
      <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function PendingUserRow({ user, onApprove, onDelete, agents }) {
  const [role, setRole] = useState("agent");
  const [agentId, setAgentId] = useState(agents[0]?.id || "");
  return (
    <div className="access-row" style={{ gap: 10 }}>
      <span className="access-row-name">{user.email}</span>
      <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="agent">Agent</option>
        <option value="officeManager">Office Manager</option>
        <option value="officeAdmin">Office Admin</option>
        <option value="marketing">Marketing</option>
        <option value="masterAdmin">Master Admin</option>
      </select>
      {role !== "masterAdmin" && role !== "marketing" && (
        <select className="select" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          <option value={ADMIN_AGENT_ID}>{ADMIN_AGENT.name}</option>
        </select>
      )}
      <button className="stage-btn active" onClick={() => onApprove(user.id, role, role === "masterAdmin" || role === "marketing" ? null : agentId)}>
        Approve
      </button>
      <button className="drawer-close" title="Remove this account" onClick={() => onDelete(user.id, user.email)}><X size={14} /></button>
    </div>
  );
}

function LinkedUserRow({ profile, onChange, onDelete, onResetPassword, agents }) {
  const [role, setRole] = useState(profile.role);
  const [agentId, setAgentId] = useState(profile.agent_id || agents[0]?.id || "");
  const label = profile.email || profile.id.slice(0, 8) + "…";
  return (
    <div className="access-row" style={{ gap: 10, flexWrap: "wrap", cursor: "default" }}>
      <span className="access-row-name" style={{ flex: "0 1 200px", fontSize: 12 }}>{label}</span>
      <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="agent">Agent</option>
        <option value="officeManager">Office Manager</option>
        <option value="officeAdmin">Office Admin</option>
        <option value="marketing">Marketing</option>
        <option value="masterAdmin">Master Admin</option>
      </select>
      {role !== "masterAdmin" && role !== "marketing" && (
        <select className="select" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          <option value={ADMIN_AGENT_ID}>{ADMIN_AGENT.name}</option>
        </select>
      )}
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button
          className="stage-btn"
          onClick={() => onChange(profile.id, role, role === "masterAdmin" || role === "marketing" ? null : agentId)}
          disabled={role === profile.role && agentId === profile.agent_id}
        >
          Save
        </button>
        <button className="stage-btn" style={{ whiteSpace: "nowrap" }} onClick={() => onResetPassword(profile.email)}>
          Reset password
        </button>
        <button className="drawer-close" title="Remove this account" onClick={() => onDelete(profile.id, label)}><X size={14} /></button>
      </div>
    </div>
  );
}

// Comma-formatted number input (e.g. "R2,000,000" instead of "R2000000").
// Shows raw digits while focused (so typing feels normal, no cursor
// fighting), reformats with thousand separators on blur. Fires onChange
// with a synthetic {target:{value}} event so existing call sites written
// for a plain <input onChange> don't need to change.
function MoneyInput({ value, onChange, className, disabled, placeholder }) {
  const [focused, setFocused] = useState(false);
  const numValue = Number(value) || 0;
  const display = focused
    ? (numValue ? String(numValue) : "")
    : (numValue ? numValue.toLocaleString("en-ZA") : "0");
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, "");
        onChange({ target: { value: raw, type: "number" } });
      }}
    />
  );
}

// Searchable, dedup-aware Purchaser/Seller picker. Typing searches the
// shared contacts book by name, email, or phone; picking a result links
// that real contact record. If nothing matches, an inline mini-form
// creates a new one — but still checks for an exact email/phone match
// first (a name typo shouldn't spawn a duplicate contact for someone
// already on file), and lets the roleLabel default the new contact's
// category (Purchaser for a buyer field, Seller for a seller field) while
// staying editable for the "Purchaser and Seller" / "Landlord" cases.
function ContactPicker({ roleLabel, nameValue, contactId, contacts, onLink, onChangeName, onUnlink, onCreateContact, onOpenDetail, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState(null);
  const [dupNote, setDupNote] = useState("");

  const linked = contactId ? contacts.find((c) => c.id === contactId) : null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const qDigits = q.replace(/\D/g, "");
    return contacts
      .filter((c) => {
        const nameMatch = (c.name || "").toLowerCase().includes(q);
        const emailMatch = (c.email || "").toLowerCase().includes(q);
        const phoneMatch = qDigits.length >= 3 && (c.phone || "").replace(/\D/g, "").includes(qDigits);
        return nameMatch || emailMatch || phoneMatch;
      })
      .slice(0, 6);
  }, [query, contacts]);

  const startCreate = () => {
    setNewDraft({ name: query || nameValue || "", phone: "", email: "", category: roleLabel });
    setCreating(true);
    setDupNote("");
  };

  const saveNewContact = async () => {
    if (!newDraft.name.trim()) return;
    const { contact, wasDuplicate } = await onCreateContact(newDraft);
    if (wasDuplicate) setDupNote("Matched an existing contact by email/phone — linked “" + contact.name + "” instead of creating a duplicate.");
    onLink(contact);
    setCreating(false);
    setOpen(false);
    setQuery("");
  };

  if (linked) {
    return (
      <div className="contact-picker-linked">
        <button type="button" className="contact-chip" disabled={disabled} onClick={() => onOpenDetail && onOpenDetail(linked.id)}>
          <span className="contact-chip-name">{linked.name}</span>
          {linked.category && <span className="contact-chip-cat">{linked.category}</span>}
        </button>
        {!disabled && <button type="button" className="drawer-close" title="Unlink" onClick={onUnlink}><X size={13} /></button>}
      </div>
    );
  }

  return (
    <div className="contact-picker">
      <input
        type="text"
        className="req-input"
        placeholder={"Search or type " + (roleLabel || "contact") + " name..."}
        disabled={disabled}
        value={query || nameValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChangeName(e.target.value);
          setOpen(true);
          setCreating(false);
        }}
      />
      {open && !disabled && (query.trim().length >= 2) && (
        <div className="contact-picker-dropdown">
          {!creating ? (
            <>
              {matches.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className="contact-picker-row"
                  onClick={() => { onLink(c); setOpen(false); setQuery(""); }}
                >
                  <span className="contact-picker-row-name">{c.name}</span>
                  <span className="contact-picker-row-sub">{[c.category, c.email, c.phone].filter(Boolean).join(" · ")}</span>
                </button>
              ))}
              {matches.length === 0 && <div className="contact-picker-empty">No matches yet.</div>}
              <button type="button" className="contact-picker-add" onClick={startCreate}>
                + Add “{query}” as a new contact
              </button>
            </>
          ) : (
            <div className="contact-picker-create">
              {dupNote && <div className="req-note" style={{ marginTop: 0, marginBottom: 8 }}>{dupNote}</div>}
              <input type="text" className="req-input" placeholder="Full name" value={newDraft.name} onChange={(e) => setNewDraft((d) => ({ ...d, name: e.target.value }))} />
              <input type="text" className="req-input" placeholder="Cell number" value={newDraft.phone} onChange={(e) => setNewDraft((d) => ({ ...d, phone: e.target.value }))} />
              <input type="text" className="req-input" placeholder="Email" value={newDraft.email} onChange={(e) => setNewDraft((d) => ({ ...d, email: e.target.value }))} />
              <select className="req-input" value={newDraft.category} onChange={(e) => setNewDraft((d) => ({ ...d, category: e.target.value }))}>
                {PARTY_CONTACT_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button type="button" className="stage-btn" onClick={() => setCreating(false)}>Back</button>
                <button type="button" className="stage-btn active" style={{ flex: 1 }} onClick={saveNewContact}>Save & link</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Plain text input that upgrades to a Google Places address autocomplete
// once the Maps script loads — falls back to a normal typed field if the
// API key isn't configured or the script fails to load, so the field is
// never actually broken, just less smart.
function AddressAutocompleteInput({ value, onChange, onSelectPlace, disabled, className, placeholder }) {
  const inputRef = useRef(null);

  useEffect(() => {
    let listener;
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "address_components", "name"],
          componentRestrictions: { country: "za" },
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place) return;
          const comps = place.address_components || [];
          const find = (type) => comps.find((c) => c.types.includes(type))?.long_name || "";
          const streetAddress = [find("street_number"), find("route")].filter(Boolean).join(" ");
          const suburb = find("sublocality") || find("locality");
          onSelectPlace({ address: streetAddress || place.formatted_address || place.name || "", suburb });
        });
      })
      .catch((e) => console.error("Google Maps autocomplete unavailable:", e.message));
    return () => {
      cancelled = true;
      if (listener) window.google?.maps?.event?.removeListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ReqForm({ lead, onChange }) {
  const r = lead.requirements || {};
  const set = (field) => (e) => {
    const v = e.target;
    const value = v.type === "checkbox" ? v.checked : v.type === "number" ? Number(v.value) : v.value;
    onChange(lead.id, field, value);
  };
  return (
    <>
      <div className="field-label">Max budget</div>
      <div className="req-input-wrap crm-mono">
        <span>R</span>
        <MoneyInput className="req-input" value={r.maxBudget || 0} onChange={set("maxBudget")} />
      </div>

      <div className="field-label">City / area preference</div>
      <select className="req-input" value={r.cityPreference || ""} onChange={set("cityPreference")}>
        {CITY_AREAS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <div className="req-grid-2">
        <div>
          <div className="field-label">Bedrooms</div>
          <input type="number" min={0} className="req-input" value={r.bedrooms || 0} onChange={set("bedrooms")} />
        </div>
        <div>
          <div className="field-label">Bathrooms</div>
          <input type="number" min={0} className="req-input" value={r.bathrooms || 0} onChange={set("bathrooms")} />
        </div>
      </div>

      <div className="field-label">Property type</div>
      <select className="req-input" value={r.propertyType || ""} onChange={set("propertyType")}>
        {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <label className="req-checkbox">
        <input type="checkbox" checked={!!r.garden} onChange={set("garden")} /> Wants a garden
      </label>

      <div className="field-label">Most important requirement</div>
      <select className="req-input" value={r.topPriority || ""} onChange={set("topPriority")}>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <div className="field-label">Why are they moving?</div>
      <select className="req-input" value={r.reasonMoving || ""} onChange={set("reasonMoving")}>
        {MOVE_REASONS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <div className="field-label">Best property seen so far</div>
      <input type="text" className="req-input" value={r.bestSeenSoFar || ""} onChange={set("bestSeenSoFar")} />

      <div className="req-divider">
        <ClipboardList size={13} /> Property to sell
      </div>

      <label className="req-checkbox">
        <input type="checkbox" checked={!!r.hasPropertyToSell} onChange={set("hasPropertyToSell")} /> Has a property to sell
      </label>

      {r.hasPropertyToSell && (
        <>
          <label className="req-checkbox">
            <input type="checkbox" checked={!!r.sellingOnMarket} onChange={set("sellingOnMarket")} /> Currently on the market
          </label>

          {r.sellingOnMarket && (
            <>
              <div className="field-label">Listed with</div>
              <select className="req-input" value={r.sellingAgency || ""} onChange={set("sellingAgency")}>
                {AGENCIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              <div className="field-label">Months on market</div>
              <input type="number" min={0} className="req-input" value={r.sellingMonths || 0} onChange={set("sellingMonths")} />
            </>
          )}

          <div className="field-label">Asking / expected price</div>
          <div className="req-input-wrap crm-mono">
            <span>R</span>
            <MoneyInput className="req-input" value={r.sellingPrice || 0} onChange={set("sellingPrice")} />
          </div>

          <label className="req-checkbox">
            <input type="checkbox" checked={!!r.hadValuation} onChange={set("hadValuation")} /> Had a valuation done
          </label>
        </>
      )}

      <div className="req-note"><Info size={12} /> Buyer profile is stored per lead — used to match them against new listings as they come onto Propdata.</div>
    </>
  );
}

const ASHTON_SEED_DEALS = [
  { id: "deal-ashton-0", leadId: null, month: "Jan 2026", property: "8 Babania Crecent", suburb: "Clearwater", askingPrice: 2300000.0, openingOffer: 2200000.0, conditions: "STB STS", bondApplyingFor: 0, bondThrough: "Thando", att: "HP", coSeller: "", coBuyers: "", cco: "", agreedOffer: 2200000.0, sharedDeal: "", comPercent: 6.0, confirmedCommission: 132000.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 68673.0, kreNettSus: 0.0, nettToKRE: 68673.0, stillToRegister: "", expRegDate: "2026-04-01", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-1", leadId: null, month: "Jan 2026", property: "75 Waterside (Shared Kay / Ash and RNS)", suburb: "Brentwood", askingPrice: 1050000.0, openingOffer: 1050000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "Other", att: "OTHER", coSeller: "", coBuyers: "", cco: "", agreedOffer: 1050000.0, sharedDeal: "YES EXTERNAL", comPercent: 1.3, confirmedCommission: 13650.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 8193.94, kreNettSus: 0.0, nettToKRE: 8193.94, stillToRegister: "", expRegDate: "2026-04-01", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-2", leadId: null, month: "Jan 2026", property: "48 Mashoba Lodge", suburb: "Brentwood", askingPrice: 1840000.0, openingOffer: 1750000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "PRVT", att: "YL", coSeller: "", coBuyers: "", cco: "", agreedOffer: 1750000.0, sharedDeal: "", comPercent: 4.78, confirmedCommission: 83650.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 43542.66, kreNettSus: 0.0, nettToKRE: 43542.66, stillToRegister: "", expRegDate: "2026-05-01", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-3", leadId: null, month: "Jan 2026", property: "42 Waters Edge", suburb: "Rynfield", askingPrice: 870000.0, openingOffer: 850000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "BB", att: "", coSeller: 870000.0, coBuyers: "", cco: "", agreedOffer: 870000.0, sharedDeal: "", comPercent: 6.0, confirmedCommission: 52200.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 27157.05, kreNettSus: 0.0, nettToKRE: 27157.05, stillToRegister: "", expRegDate: "2026-05-01", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-4", leadId: null, month: "Feb 2026", property: "10 Jordaan Place", suburb: "Rynfield", askingPrice: 2900000.0, openingOffer: 2800000.0, conditions: "STB STS SOLD", bondApplyingFor: 0, bondThrough: "Thando", att: "YL", coSeller: "", coBuyers: "", cco: "", agreedOffer: 2800000.0, sharedDeal: "NO", comPercent: 3.11, confirmedCommission: 87080.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 45239.13, kreNettSus: 0.0, nettToKRE: 45239.13, stillToRegister: "", expRegDate: "", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-5", leadId: null, month: "Feb 2026", property: "61 Eden Gardens", suburb: "Rynfield", askingPrice: 730000.0, openingOffer: 600000.0, conditions: "Cash", bondApplyingFor: 0, bondThrough: "", att: "", coSeller: 680000.0, coBuyers: "", cco: "", agreedOffer: 1450000.0, sharedDeal: "", comPercent: 3.77, confirmedCommission: 54665.0, suspensive: 0.0, fallOut: 54617.39, kreNettConfirmed: 0.0, kreNettSus: 0.0, nettToKRE: 0.0, stillToRegister: "", expRegDate: "", dealStatus: "Yellow", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Suspensive Bond" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-6", leadId: null, month: "Feb 2026", property: "33 Bel Air (Shared 50/50 Ash and Aly)", suburb: "Rynfield", askingPrice: 1450000.0, openingOffer: 1450000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "Thando", att: "", coSeller: "", coBuyers: "", cco: "", agreedOffer: 1450000.0, sharedDeal: "YES INTERNAL", comPercent: 3.0, confirmedCommission: 43500.0, suspensive: 0.0, fallOut: 43500.0, kreNettConfirmed: 0.0, kreNettSus: 0.0, nettToKRE: 0.0, stillToRegister: "", expRegDate: "", dealStatus: "Yellow", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Suspensive Bond" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-7", leadId: null, month: "Mar 2026", property: "111C Sarel Cilliers", suburb: "Rynfield", askingPrice: 1100000.0, openingOffer: 1000000.0, conditions: "Cash", bondApplyingFor: 0, bondThrough: "", att: "", coSeller: "", coBuyers: "", cco: "", agreedOffer: 1000000.0, sharedDeal: "", comPercent: 6.0, confirmedCommission: 60000.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 31215.0, kreNettSus: 0.0, nettToKRE: 0, stillToRegister: "", expRegDate: "", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-8", leadId: null, month: "Apr 2026", property: "36 Stanton Heightd", suburb: "Brentwood", askingPrice: 1100000.0, openingOffer: 1000000.0, conditions: "Cash", bondApplyingFor: 0, bondThrough: "", att: "", coSeller: 1075000.0, coBuyers: 1000000.0, cco: "", agreedOffer: 0, sharedDeal: "", comPercent: 0, confirmedCommission: 0.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 0.0, kreNettSus: 0.0, nettToKRE: 0.0, stillToRegister: "", expRegDate: "", dealStatus: "Silver", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Suspensive Bond" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-9", leadId: null, month: "May 2026", property: "11 Stokroos", suburb: "Northmead", askingPrice: 2750000.0, openingOffer: 2680000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "", att: "HP", coSeller: 2700000.0, coBuyers: "", cco: "", agreedOffer: 2700000.0, sharedDeal: "", comPercent: 5.5, confirmedCommission: 148500.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 77257.12, kreNettSus: 0.0, nettToKRE: 77257.12, stillToRegister: "", expRegDate: "", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-10", leadId: null, month: "May 2026", property: "48 Waters Edge", suburb: "Rynfield", askingPrice: 1180000.0, openingOffer: 1100000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "Thando", att: "", coSeller: "", coBuyers: "", cco: "", agreedOffer: 1100000.0, sharedDeal: "", comPercent: 5.0, confirmedCommission: 55000.0, suspensive: 0.0, fallOut: 55000.0, kreNettConfirmed: 0.0, kreNettSus: 0.0, nettToKRE: 0.0, stillToRegister: "", expRegDate: "", dealStatus: "Yellow", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Suspensive Bond" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-11", leadId: null, month: "May 2026", property: "33 Bel-Aire Place (50/50 Ash and Nic Mc)", suburb: "Rynfield", askingPrice: 1450000.0, openingOffer: 1350000.0, conditions: "STB STS", bondApplyingFor: 0, bondThrough: "PRVT", att: "JJ", coSeller: 1400000.0, coBuyers: "", cco: "", agreedOffer: 1400000.0, sharedDeal: "YES INTERNAL", comPercent: 1.52, confirmedCommission: 21280.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 11083.59, kreNettSus: 0.0, nettToKRE: 11083.59, stillToRegister: "", expRegDate: "", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-12", leadId: null, month: "May 2026", property: "36 Stanton Heights", suburb: "Rynfield", askingPrice: 1100000.0, openingOffer: 1000000.0, conditions: "Cash", bondApplyingFor: 0, bondThrough: "", att: "", coSeller: "", coBuyers: "", cco: "", agreedOffer: 1000000.0, sharedDeal: "", comPercent: 4.0, confirmedCommission: 40000.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 20810.0, kreNettSus: 0.0, nettToKRE: 20810.0, stillToRegister: "", expRegDate: "", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-13", leadId: null, month: "May 2026", property: "48 Waters Edge", suburb: "Rynfield", askingPrice: 1180000.0, openingOffer: 1100000.0, conditions: "Cash", bondApplyingFor: 0, bondThrough: "", att: "YL", coSeller: "", coBuyers: "", cco: "", agreedOffer: 0, sharedDeal: "", comPercent: 0, confirmedCommission: 0.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 0.0, kreNettSus: 0.0, nettToKRE: 0.0, stillToRegister: "", expRegDate: "", dealStatus: "Silver", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Suspensive Bond" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
  { id: "deal-ashton-14", leadId: null, month: "Jun 2026", property: "167 Lauriston", suburb: "Benoni AH", askingPrice: 6850000.0, openingOffer: 6850000.0, conditions: "STB100%", bondApplyingFor: 0, bondThrough: "PRVT", att: "", coSeller: "", coBuyers: "", cco: "", agreedOffer: 6850000.0, sharedDeal: "", comPercent: 6.5, confirmedCommission: 445250.0, suspensive: 0.0, fallOut: 0, kreNettConfirmed: 231641.31, kreNettSus: 0.0, nettToKRE: 231641.31, stillToRegister: "", expRegDate: "", dealStatus: "Gold", agent: "a2" , listingAgent: "a2", sharedWithAgent: "", sharedSplit: "" , conditionStatus: "Above the line" , transferSteps: buildDefaultTransferSteps(), activity: [], buyerEmail: "", buyerName: "", sellerEmail: "", sellerName: "", otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null },
];

// --- Mock data generators (deals/offers/targets for every agent, Jan-Jul 2026) ---
const MOCK_MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026"];
const MOCK_SUBURBS = ["Rynfield", "Northmead", "Brentwood", "Farrarmere", "Crystal Park", "Beyers Park", "Morehill", "Lakefield", "Benoni AH", "Van Ryn", "Ravenswood", "Delmore Park"];
const MOCK_STREETS = ["Oak Avenue", "Protea Close", "Jacaranda Road", "Voortrekker Street", "Rietfontein Road", "Kingfisher Crescent", "Cedar Way", "Harmony Road", "Sunbird Street", "Camelia Avenue", "Beryl Street", "Amber Close"];
const MOCK_CONDITIONS_CYCLE = ["Above the line", "Suspensive Bond", "Suspensive of Bond and Sale", "Full Cash awaiting Cash", "Above the line", "Above the line", "Fallen through"];
const MOCK_TIER_CYCLE = ["Yellow", "Blue", "Silver", "Gold"];
const MOCK_BOND_CYCLE = ["NA", "Multinet", "Ooba", "Betterbond", "Standard Bank Direct", "Nedbank Direct", "ABSA Direct"];
const MOCK_ATT_CYCLE = ["Hammond Pole", "Young Law", "Jan Jordaan", "Tuckers", "Du Plessis Van Loggenburg"];
const MOCK_BUYER_NAMES = ["Grant Adams", "Sarah Botha", "Michael Chetty", "Priya Naidoo", "Thabo Dlamini", "Chantal Fourie", "Werner Erasmus", "Naledi Mokoena", "Craig Isaacs", "Farah Hendricks", "Johan Kruger", "Lindiwe Zulu"];
const MOCK_SELLER_NAMES = ["Jerome van Wyk", "Anita Pretorius", "David Naidoo", "Bongani Khumalo", "Elmarie Steyn", "Kevin Govender", "Marissa Botes", "Sipho Ndlovu", "Charmaine Roos", "Riaan Coetzee", "Fatima Ismail", "Trevor Baker"];

function mockDeal(agent, i, monthIdx) {
  const suburb = MOCK_SUBURBS[(i * 3 + monthIdx) % MOCK_SUBURBS.length];
  const streetNum = 3 + ((i * 11 + monthIdx * 7) % 190);
  const street = MOCK_STREETS[(i * 5 + monthIdx * 2) % MOCK_STREETS.length];
  const asking = 850000 + ((i * 137 + monthIdx * 211) % 24) * 100000;
  const agreed = Math.round((asking * (0.9 + ((i + monthIdx) % 8) / 100)) / 5000) * 5000;
  const tier = MOCK_TIER_CYCLE[(i + monthIdx + AGENTS.indexOf(agent)) % 4];
  const condition = MOCK_CONDITIONS_CYCLE[(i * 2 + monthIdx) % MOCK_CONDITIONS_CYCLE.length];
  const comPercent = [3, 3.5, 4, 4.5, 5, 5.5, 6][(i + monthIdx) % 7];
  const confirmedCommission = Math.round(agreed * comPercent) / 100;
  const isFallen = condition === "Fallen through";
  const registered = !isFallen && condition === "Above the line" && (i + monthIdx) % 3 === 0;
  const steps = buildDefaultTransferSteps();
  if (registered) {
    steps.forEach((s, idx) => { s.done = true; s.dateCompleted = "2026-0" + (((monthIdx + 1) % 9) + 1) + "-1" + (idx % 9); });
  } else if (!isFallen) {
    const doneCount = (i + monthIdx) % 6;
    steps.forEach((s, idx) => { if (idx < doneCount) { s.done = true; s.dateCompleted = "2026-0" + (((monthIdx) % 9) + 1) + "-0" + ((idx % 8) + 1); } });
  }
  return {
    id: "mockdeal-" + agent.id + "-" + i,
    leadId: null, offerId: null,
    month: MOCK_MONTHS[monthIdx % MOCK_MONTHS.length],
    property: streetNum + " " + street,
    suburb,
    askingPrice: asking,
    openingOffer: Math.round(asking * 0.95 / 5000) * 5000,
    conditions: isFallen ? "Buyer's bond declined" : "Subject to bond approval",
    bondThrough: MOCK_BOND_CYCLE[(i + monthIdx) % MOCK_BOND_CYCLE.length],
    bondApplyingFor: isFallen ? 0 : Math.round(agreed * 0.85 / 5000) * 5000,
    att: MOCK_ATT_CYCLE[(i + monthIdx) % MOCK_ATT_CYCLE.length],
    coSeller: "", coBuyers: "", cco: "",
    agreedOffer: agreed,
    sharedDeal: "No",
    comPercent,
    confirmedCommission,
    suspensive: 0, fallOut: isFallen ? confirmedCommission : 0,
    kreNettConfirmed: 0, kreNettSus: 0, nettToKRE: 0,
    stillToRegister: registered ? "No" : "Yes",
    expRegDate: "2026-0" + (((monthIdx + 2) % 9) + 1) + "-15",
    dealStatus: tier,
    agent: agent.id, listingAgent: agent.id,
    sharedWithAgent: "", sharedSplit: "",
    conditionStatus: condition,
    transferSteps: steps,
    activity: [],
    buyerEmail: "", buyerName: MOCK_BUYER_NAMES[(i + monthIdx) % MOCK_BUYER_NAMES.length],
    sellerEmail: "", sellerName: MOCK_SELLER_NAMES[(i + monthIdx) % MOCK_SELLER_NAMES.length],
    otpFileName: "", otpFileData: "", commStatementFileName: "", commStatementFileData: "",
    otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false, otpTodoId: null,
  };
}

function generateMockDeals() {
  const results = [];
  AGENTS.forEach((agent) => {
    if (agent.id === "a2") return; // Ashton already has real seed deals
    const dealCount = 2 + (AGENTS.indexOf(agent) % 3);
    for (let i = 0; i < dealCount; i++) {
      const monthIdx = (AGENTS.indexOf(agent) + i) % 7;
      results.push(mockDeal(agent, i, monthIdx));
    }
  });
  return results;
}

function mockOffer(agent, i, monthIdx) {
  const suburb = MOCK_SUBURBS[(i * 4 + monthIdx) % MOCK_SUBURBS.length];
  const streetNum = 5 + ((i * 13 + monthIdx * 5) % 170);
  const street = MOCK_STREETS[(i * 2 + monthIdx * 3) % MOCK_STREETS.length];
  const asking = 780000 + ((i * 119 + monthIdx * 173) % 20) * 100000;
  const offerMade = Math.round(asking * 0.92 / 5000) * 5000;
  const agreedCycle = ["Pending", "Pending", "No", "Pending"];
  const agreed = agreedCycle[(i + monthIdx) % agreedCycle.length];
  return {
    id: "mockoffer-" + agent.id + "-" + i,
    leadId: null, dealId: null,
    month: MOCK_MONTHS[monthIdx % MOCK_MONTHS.length],
    property: streetNum + " " + street,
    suburb,
    askingPrice: asking,
    offerMade,
    conditions: "Subject to bond approval",
    sellerCounterOffer: (i + monthIdx) % 2 === 0 ? Math.round(asking * 0.97 / 5000) * 5000 : 0,
    buyerCounterOffer: 0,
    agreed,
    agreedPrice: 0,
    agent: agent.id, listingAgent: agent.id,
    buyerName: MOCK_BUYER_NAMES[(i + monthIdx + 3) % MOCK_BUYER_NAMES.length],
    sellerName: MOCK_SELLER_NAMES[(i + monthIdx + 3) % MOCK_SELLER_NAMES.length],
    sharedDeal: "No", sharedWithAgent: "", sharedSplit: "", comPercent: 5,
    activity: [{ id: "mockoact-" + agent.id + "-" + i, type: "System", text: "Offer created", author: null, timestamp: monthLabelToDate(MOCK_MONTHS[monthIdx % MOCK_MONTHS.length]) }],
  };
}

function generateMockOffers() {
  const results = [];
  AGENTS.forEach((agent) => {
    const offerCount = 1 + (AGENTS.indexOf(agent) % 3);
    for (let i = 0; i < offerCount; i++) {
      const monthIdx = (AGENTS.indexOf(agent) + i + 2) % 7;
      results.push(mockOffer(agent, i, monthIdx));
    }
  });
  return results;
}

function generateMockTargets() {
  const byAgent = {};
  AGENTS.forEach((a, i) => {
    byAgent[a.id] = 2500000 + (a.closed || 0) * 350000 + (i % 4) * 400000;
  });
  return { "2026": byAgent };
}

function RealtyCRM({ profile }) {
  const [nav, setNav] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [mergeRequests, setMergeRequests] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [agentsList, setAgentsList] = useState(AGENTS);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [agentFormDraft, setAgentFormDraft] = useState({ name: "", initials: "", title: "", cell: "", email: "", tier: "Yellow" });

  const [marketingSectorView, setMarketingSectorView] = useState("Commercial");
  const [marketingBudgets, setMarketingBudgets] = useState([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState([]);
  const [brokerRotation, setBrokerRotation] = useState([]);
  const [rotationCursor, setRotationCursor] = useState(0);
  const [leadAllocations, setLeadAllocations] = useState([]);
  const [rotationAgentDraft, setRotationAgentDraft] = useState("");
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [budgetFormDraft, setBudgetFormDraft] = useState({ name: "", platform: "Meta", sector: "Commercial", startDate: "", endDate: "", budget: "" });
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState(null);
  const [campaignFormDraft, setCampaignFormDraft] = useState({ name: "", budgetId: "", platform: "Meta", sector: "Commercial", area: "East Rand", status: "Planned", spend: "", allocation: "", startDate: "", endDate: "", brokers: [] });
  const [campaignFilters, setCampaignFilters] = useState({ search: "", status: "all", platform: "all", sector: "all", area: "all", broker: "all", from: "", to: "" });
  const [assignLeadCampaignId, setAssignLeadCampaignId] = useState(null);
  const [assignLeadDraft, setAssignLeadDraft] = useState({ name: "", phone: "", email: "", agent: "" });

  const [manualContacts, setManualContacts] = useState([]);
  const [contactsFilter, setContactsFilter] = useState("all");
  const [contactsSearch, setContactsSearch] = useState("");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contactFormDraft, setContactFormDraft] = useState({ name: "", category: "Tenant", phone: "", email: "", address: "", notes: "" });
  const [leadsImportSummary, setLeadsImportSummary] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [query, setQuery] = useState("");
  const currentAgentId = profile.agent_id || (profile.role === "officeAdmin" ? ADMIN_AGENT_ID : null);
  const currentRole = profile.role;
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);
  const [todos, setTodos] = useState([]);
  const [noteDraft, setNoteDraft] = useState({ type: "Call", text: "", listingRef: "", viewingDate: "" });
  const [followUpDraft, setFollowUpDraft] = useState({ reason: FOLLOWUP_OPTIONS[0], text: "" });
  const [listingsData, setListingsData] = useState([]);
  const [doorKnocks, setDoorKnocks] = useState([]);
  const [selectedDK, setSelectedDK] = useState(null);
  const [hoveredDK, setHoveredDK] = useState(null);
  const [canvassView, setCanvassView] = useState("board");
  const [addCanvasOpen, setAddCanvasOpen] = useState(false);
  const [canvasFormDraft, setCanvasFormDraft] = useState({
    address: "", suburb: "", sellPrice: "", marketingLink: "", ownerName: "",
    ownerPhone: "", emailContactDetails: "", followUpDate: "",
  });
  const [editCanvasId, setEditCanvasId] = useState(null);
  const [canvasStatusFilter, setCanvasStatusFilter] = useState("all");
  const [canvasSearch, setCanvasSearch] = useState("");
  const [canvasShowArchived, setCanvasShowArchived] = useState(false);
  const [collapsedCanvasCols, setCollapsedCanvasCols] = useState({});
  const [dkNoteDraft, setDkNoteDraft] = useState("");
  const [dkFollowUpDraft, setDkFollowUpDraft] = useState("");
  const [valuationDraft, setValuationDraft] = useState({ date: "", agent: currentAgentId, price: "", pdfName: "" });
  const [deals, setDeals] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeVertical, setActiveVertical] = useState("sales");
  const [rentalAgentsList, setRentalAgentsList] = useState([]);
  const [rentalOffers, setRentalOffers] = useState([]);
  const [rentalDeals, setRentalDeals] = useState([]);
  const [periodMode, setPeriodMode] = useState("year");
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("Jan");

  useEffect(() => {
    let active = true;
    (async () => {
      setDataLoading(true);
      setDataError("");
      try {
        if (currentRole === "masterAdmin" || currentRole === "officeManager") {
          await Promise.all([
            api.listings.upsertListings(LISTINGS).catch(() => {}),
            api.attorneys.upsertAttorneyNames(ATTORNEY_OPTIONS).catch(() => {}),
          ]);
        }
        const [
          agentsRows, attorneysRows, targetsByYear, todosRows, contactsRows, listingsRows,
          canvassingRows, leadsRows, mergeRequestsRows, offersRows, dealsRows,
          budgetsRows, campaignsRows, rotationData, allocationsRows,
          rolePermissionsData, roleDealColumnsData,
        ] = await Promise.all([
          api.agents.fetchAgents(), api.attorneys.fetchAttorneys(), api.targets.fetchTargets(),
          api.todos.fetchTodos(), api.contacts.fetchContacts(), api.listings.fetchListings(),
          api.canvassing.fetchCanvassingRecords(), api.leads.fetchLeads(), api.leads.fetchMergeRequests(),
          api.offers.fetchOffers(), api.deals.fetchDeals(),
          api.marketing.fetchBudgets(), api.marketing.fetchCampaigns(), api.marketing.fetchRotation(), api.marketing.fetchAllocations(),
          api.permissions.fetchRolePermissions(), api.permissions.fetchRoleDealColumns(),
        ]);
        if (!active) return;

        setAgentsList(agentsRows);
        setAgentContacts(Object.fromEntries(agentsRows.map((a) => [a.id, { cell: a.cell, email: a.email }])));
        setAttorneyEmails((prev) => ({ ...prev, ...Object.fromEntries(attorneysRows.map((a) => [a.name, a.email])) }));
        setAttorneyPhones((prev) => ({ ...prev, ...Object.fromEntries(attorneysRows.map((a) => [a.name, a.phone])) }));
        setAttorneyContacts((prev) => ({ ...prev, ...Object.fromEntries(attorneysRows.map((a) => [a.name, a.contactName])) }));
        setAgentTargets(targetsByYear);
        setTodos(todosRows);
        setManualContacts(contactsRows);
        setListingsData(listingsRows.length ? listingsRows : LISTINGS);
        setDoorKnocks(canvassingRows);
        setLeads(leadsRows);
        setMergeRequests(mergeRequestsRows);
        setOffers(offersRows);
        setDeals(dealsRows.map((d) => ({
          ...d,
          transferSteps: TRANSFER_STEPS.map((label, i) => {
            const row = (d.transferStepRows || []).find((s) => s.step_index === i);
            return { key: "step" + i, label, done: row?.done || false, dateCompleted: row?.date_completed || "" };
          }),
        })));
        setMarketingBudgets(budgetsRows);
        setMarketingCampaigns(campaignsRows);
        setBrokerRotation(rotationData.agentIds.length ? rotationData.agentIds : agentsList.map((a) => a.id));
        setRotationCursor(rotationData.cursor);
        setLeadAllocations(allocationsRows);
        setRolePermissions((prev) => ({
          officeManager: { ...prev.officeManager, ...rolePermissionsData.officeManager },
          agent: { ...prev.agent, ...rolePermissionsData.agent },
          officeAdmin: { ...prev.officeAdmin, ...rolePermissionsData.officeAdmin },
        }));
        setRoleHiddenColumns((prev) => ({ ...prev, ...roleDealColumnsData }));

        // Rentals is a masterAdmin/officeManager-only vertical for now (no
        // rental-agent logins exist yet) — RLS would just return empty
        // arrays for anyone else, so skip the requests entirely for them.
        if (currentRole === "masterAdmin" || currentRole === "officeManager") {
          const [rentalAgentRows, rentalOfferRows, rentalDealRows, rentalTargetsByYear] = await Promise.all([
            api.rentalAgents.fetchRentalAgents(), api.rentalOffers.fetchRentalOffers(), api.rentalDeals.fetchRentalDeals(),
            api.rentalTargets.fetchRentalTargets(),
          ]);
          if (!active) return;
          setRentalAgentsList(rentalAgentRows);
          setRentalOffers(rentalOfferRows);
          setRentalDeals(rentalDealRows);
          setRentalAgentTargets(rentalTargetsByYear);
        }
      } catch (err) {
        console.error("Failed to load data from Supabase", err);
        if (active) setDataError(err.message || "Failed to load data from Supabase.");
      } finally {
        if (active) setDataLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agentName = (id) => {
    if (id === ADMIN_AGENT_ID) return ADMIN_AGENT.name;
    return agentsList.find((a) => a.id === id)?.name || "Unassigned";
  };

  // An agent's status (Yellow/Blue/Silver/Gold, Master-Admin-only) is
  // stamped onto a deal at creation time — new deals/offers for an agent
  // default to whatever their status is right now; changing an agent's
  // status later never touches deals already created under the old one.
  const agentTier = (id) => agentsList.find((a) => a.id === id)?.tier || "Yellow";

  // Same rule as canAccessNav, parameterized by an arbitrary role — used by the
  // masterAdmin-only nav preview on the Access Control page so it can show
  // "what role X's sidebar looks like" without touching currentRole/currentAgentId.
  const navAccessForRole = (role, key) => {
    if (role === "masterAdmin") return true;
    if (role === "marketing") return key === "marketing" || key === "todos";
    if (key === "marketing") return role === "officeManager";
    return rolePermissions[role]?.[key] !== false;
  };

  const canAccessNav = (key) => navAccessForRole(currentRole, key);

  // Master Admin always has full underlying access (by design — otherwise
  // they could accidentally lock themselves out of Access Control with no
  // way back in). This is a purely personal, reversible display
  // preference layered on top, stored per-browser — hiding a section here
  // never touches the real permission system other roles see.
  const MY_NAV_PREF_KEY = "kore_my_hidden_nav";
  const [myHiddenNav, setMyHiddenNav] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MY_NAV_PREF_KEY) || "[]"); } catch { return []; }
  });
  const toggleMyHiddenNav = (key) => {
    setMyHiddenNav((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try { localStorage.setItem(MY_NAV_PREF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const showInMySidebar = (key) => canAccessNav(key) && !(currentRole === "masterAdmin" && myHiddenNav.includes(key));

  const togglePermission = (role, key) => {
    setRolePermissions((prev) => ({ ...prev, [role]: { ...prev[role], [key]: !prev[role][key] } }));
    api.permissions.togglePermission(role, key, !rolePermissions[role]?.[key]).catch((e) => console.error("Failed to save permission", e));
  };

  const agentInitials = (id) => agentsList.find((a) => a.id === id)?.initials || "?";
  const listingFor = (ref) => listingsData.find((l) => l.ref === ref);

  const refreshUserLists = () => {
    api.auth.fetchAllUsers()
      .then((rows) => {
        setPendingUsers(rows.filter((u) => !u.role));
        setLinkedProfiles(rows.filter((u) => u.role).map((u) => ({ id: u.id, email: u.email, role: u.role, agent_id: u.agent_id })));
      })
      .catch((e) => console.error("Failed to load users", e));
  };

  useEffect(() => {
    if (nav === "accesscontrol" && currentRole === "masterAdmin") refreshUserLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, currentRole]);

  // Microsoft To Do — one-way push (KORE -> Microsoft). Each user connects
  // their own Microsoft account from the To-Dos page; every KORE task
  // created for them afterward gets pushed into a dedicated "KORE Tasks"
  // list, and checking it off in KORE marks it completed there too.
  const [msTodoStatus, setMsTodoStatus] = useState({ connected: false, msEmail: "" });
  const [msTodoBusy, setMsTodoBusy] = useState(false);
  const refreshMsTodoStatus = () => {
    api.msTodo.getStatus().then(setMsTodoStatus).catch((e) => console.error("Failed to load Microsoft To Do status", e));
  };
  useEffect(() => {
    const pending = api.msTodo.consumePendingCallback();
    if (pending) {
      setMsTodoBusy(true);
      api.msTodo.exchangeCode(pending.code)
        .then(() => refreshMsTodoStatus())
        .catch((e) => alert("Couldn't connect Microsoft To Do: " + e.message))
        .finally(() => setMsTodoBusy(false));
    } else {
      refreshMsTodoStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const connectMsTodo = () => {
    try {
      window.location.href = api.msTodo.buildConnectUrl();
    } catch (e) {
      alert(e.message);
    }
  };
  const disconnectMsTodo = () => {
    if (!confirm("Disconnect Microsoft To Do? Tasks already pushed will stay in Microsoft To Do, but new ones will stop syncing.")) return;
    api.msTodo.disconnect().then(refreshMsTodoStatus).catch((e) => alert("Couldn't disconnect: " + e.message));
  };
  // Fire-and-forget — a sync hiccup should never block the KORE task
  // itself from being created or completed.
  const pushTodoToMsToDo = (todoId) => { api.msTodo.pushTask(todoId).catch((e) => console.error("Microsoft To Do push failed", e)); };
  const completeTodoInMsToDo = (todoId) => { api.msTodo.completeTask(todoId).catch((e) => console.error("Microsoft To Do complete failed", e)); };

  const handleApproveUser = (userId, role, agentId) => {
    api.auth.approveUser(userId, role, agentId || null)
      .then(refreshUserLists)
      .catch((e) => alert("Couldn't approve user: " + e.message));
  };

  const handleChangeUserRole = (userId, role, agentId) => {
    api.auth.updateUserRole(userId, role, agentId || null)
      .then(refreshUserLists)
      .catch((e) => alert("Couldn't update user: " + e.message));
  };

  const handleDeleteUserAccount = (userId, label) => {
    if (!window.confirm("Permanently remove the login account for " + label + "? This can't be undone — they'll need a brand new account to sign in again.")) return;
    api.auth.deleteUserAccount(userId)
      .then(refreshUserLists)
      .catch((e) => alert("Couldn't remove account: " + e.message));
  };

  const handleAdminResetPassword = (email) => {
    if (!email) { alert("No email on file for this account."); return; }
    if (!window.confirm("Send a password reset email to " + email + "?")) return;
    api.auth.resetPassword(email)
      .then(() => alert("Reset email sent to " + email + "."))
      .catch((e) => alert("Couldn't send reset email: " + e.message));
  };

  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "agent", agentId: "" });
  const [inviteStatus, setInviteStatus] = useState(null);

  const handleInviteUser = () => {
    if (!inviteDraft.email.trim()) return;
    setInviteStatus(null);
    const agentId = inviteDraft.role === "masterAdmin" || inviteDraft.role === "marketing" ? null : (inviteDraft.agentId || null);
    api.auth.inviteUser(inviteDraft.email.trim(), inviteDraft.role, agentId)
      .then(() => {
        setInviteStatus({ ok: true, message: "Invite sent to " + inviteDraft.email.trim() + "." });
        setInviteDraft({ email: "", role: "agent", agentId: "" });
        refreshUserLists();
      })
      .catch((e) => setInviteStatus({ ok: false, message: e.message }));
  };

  const nextAgentId = () => {
    const nums = agentsList.map((a) => parseInt(String(a.id).replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return "a" + ((nums.length ? Math.max(...nums) : 0) + 1);
  };

  const handleAddAgent = () => {
    if (!agentFormDraft.name.trim()) return;
    const id = nextAgentId();
    const initials = (agentFormDraft.initials || agentFormDraft.name.slice(0, 2)).toUpperCase();
    api.agents.createAgent({
      id, name: agentFormDraft.name.trim(), initials, office: OFFICE,
      title: agentFormDraft.title, cell: agentFormDraft.cell, email: agentFormDraft.email,
      tier: agentFormDraft.tier,
    })
      .then((saved) => {
        setAgentsList((prev) => [...prev, saved]);
        setAgentFormDraft({ name: "", initials: "", title: "", cell: "", email: "", tier: "Yellow" });
        setAddAgentOpen(false);
      })
      .catch((e) => alert("Couldn't add agent: " + e.message));
  };

  const handleRemoveAgent = (agentId) => {
    const agent = agentsList.find((a) => a.id === agentId);
    const name = agent ? agent.name : "this agent";
    if (!window.confirm(
      "Permanently delete " + name + "? Their leads, offers, and deals are NOT deleted, but will show as unassigned everywhere (including the leaderboard) — this can't be undone. " +
      "If you just want to revoke their login while keeping everything attributed to them, use “Deactivate” instead of delete."
    )) return;
    api.agents.deleteAgent(agentId)
      .then(() => setAgentsList((prev) => prev.filter((a) => a.id !== agentId)))
      .catch((e) => alert("Couldn't remove agent: " + e.message));
  };

  const handleSetAgentTier = (agentId, tier) => {
    setAgentsList((prev) => prev.map((a) => (a.id === agentId ? { ...a, tier } : a)));
    api.agents.updateAgentTier(agentId, tier).catch((e) => {
      alert("Couldn't save status: " + e.message);
      setAgentsList((prev) => prev.map((a) => (a.id === agentId && a.tier === tier ? { ...a, tier: a.tier } : a)));
    });
  };

  const handleSetAgentActive = (agentId, active) => {
    const agent = agentsList.find((a) => a.id === agentId);
    const name = agent ? agent.name : "this agent";
    const msg = active
      ? "Reactivate " + name + "? Their login will work again."
      : "Deactivate " + name + "? Their login is revoked immediately — they won't be able to sign in or reset their password. All their leads/offers/deals/canvassing stay exactly as they are, and Master Admin / Office Manager keep full access to it. They'll still show on the leaderboard for Master Admin and Office Manager, but be hidden from other agents' leaderboard view.";
    if (!window.confirm(msg)) return;
    api.agents.setAgentStatus(agentId, active)
      .then(() => setAgentsList((prev) => prev.map((a) => (a.id === agentId ? { ...a, active } : a))))
      .catch((e) => alert("Couldn't update: " + e.message));
  };

  const handleUpdateAgentField = (agentId, field, value) => {
    setAgentsList((prev) => prev.map((a) => (a.id === agentId ? { ...a, [field]: value } : a)));
    api.agents.updateAgent(agentId, { [field]: value }).catch((e) => console.error("Failed to save agent field", e));
  };

  const handleUploadAgentPhoto = (agentId, file) => {
    if (!file) return;
    api.agents.uploadAgentPhoto(agentId, file)
      .then((saved) => setAgentsList((prev) => prev.map((a) => (a.id === agentId ? saved : a))))
      .catch((e) => alert("Couldn't upload photo: " + e.message));
  };

  const filteredLeads = useMemo(() => {
    const forcedAgent = currentRole === "agent" ? currentAgentId : filterAgent;
    return leads
      .filter((l) => (filterSource === "all" ? true : l.source === filterSource))
      .filter((l) => (filterStatus === "all" ? true : l.status === filterStatus))
      .filter((l) => (forcedAgent === "all" ? true : l.agent === forcedAgent))
      .filter((l) =>
        query.trim() === ""
          ? true
          : (l.name + l.listingAddress).toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.date - a.date);
  }, [leads, filterSource, filterStatus, filterAgent, query, currentRole, currentAgentId]);

  const scopedLeads = useMemo(
    () => (currentRole === "agent" ? leads.filter((l) => l.agent === currentAgentId) : leads),
    [leads, currentRole, currentAgentId]
  );

  const scopedDoorKnocks = useMemo(
    () => (currentRole === "agent" ? doorKnocks.filter((d) => d.agent === currentAgentId) : doorKnocks),
    [doorKnocks, currentRole, currentAgentId]
  );

  const [kpiPeriodMode, setKpiPeriodMode] = useState("week");
  const [kpiPeriodOffset, setKpiPeriodOffset] = useState(0);
  const [kpiChartMetric, setKpiChartMetric] = useState("coldCalls");

  const agentKpis = useMemo(() => {
    const now = new Date("2026-07-08T00:00:00");
    const [start, end] = getKpiPeriodRange(kpiPeriodMode, kpiPeriodOffset, now);
    const inRange = (d) => d >= start && d < end;
    // Inactive agents keep showing on the leaderboard for masterAdmin/
    // officeManager (their history stays intact) but are hidden from
    // other agents' view of it. Non-brokers (e.g. a Director) never show
    // here regardless of role.
    const visibleAgents = (currentRole === "agent" ? agentsList.filter((a) => a.active !== false) : agentsList)
      .filter((a) => !a.excludeFromLeaderboard);
    const byAgent = {};
    visibleAgents.forEach((a) => { byAgent[a.id] = { coldCalls: 0, doorKnocks: 0, valuations: 0, listings: 0, viewings: 0, offers: 0, deals: 0 }; });

    doorKnocks.forEach((dk) => {
      (dk.notes || []).forEach((n) => {
        if (!n.author || !byAgent[n.author]) return;
        if (!inRange(new Date(n.date))) return;
        if (n.type === "Call") byAgent[n.author].coldCalls++;
        if (n.type === "Door Knock") byAgent[n.author].doorKnocks++;
        if (n.type === "Listing") byAgent[n.author].listings++;
      });
      if (dk.valuation && dk.valuation.agent && byAgent[dk.valuation.agent] && inRange(new Date(dk.valuation.date))) {
        byAgent[dk.valuation.agent].valuations++;
      }
    });

    leads.forEach((l) => {
      (l.activity || []).forEach((a) => {
        if (a.type !== "Viewing Booked" || !a.author || !byAgent[a.author]) return;
        if (inRange(new Date(a.timestamp))) byAgent[a.author].viewings++;
      });
    });

    offers.forEach((o) => {
      if (!byAgent[o.agent]) return;
      if (inRange(recordCreatedDate(o))) byAgent[o.agent].offers++;
    });

    deals.forEach((d) => {
      if (!byAgent[d.agent]) return;
      if (inRange(recordCreatedDate(d))) byAgent[d.agent].deals++;
    });

    const rows = visibleAgents.map((a) => ({ agent: a, ...byAgent[a.id] }));
    const teamTotals = { coldCalls: 0, doorKnocks: 0, valuations: 0, listings: 0, viewings: 0, offers: 0, deals: 0 };
    rows.forEach((r) => { Object.keys(teamTotals).forEach((k) => { teamTotals[k] += r[k]; }); });
    return { rows, teamTotals, start, end };
  }, [doorKnocks, leads, offers, deals, kpiPeriodMode, kpiPeriodOffset, agentsList, currentRole]);

  const kpiPeriodLabel = useMemo(() => {
    const { start, end } = agentKpis;
    if (kpiPeriodMode === "week") {
      const endDisp = new Date(end);
      endDisp.setDate(endDisp.getDate() - 1);
      return "Week of " + fmtDate(start) + " – " + fmtDate(endDisp);
    }
    if (kpiPeriodMode === "quarter") return "Q" + (Math.floor(start.getMonth() / 3) + 1) + " " + start.getFullYear();
    if (kpiPeriodMode === "year") return String(start.getFullYear());
    return start.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  }, [agentKpis, kpiPeriodMode]);

  const scopedDeals = useMemo(() => {
    if ((currentRole === "agent" || currentRole === "officeAdmin") && currentAgentId === ADMIN_AGENT_ID) {
      return deals.filter((d) => !(d.otpSentBuyer && d.otpSentSeller && d.otpSentAttorney));
    }
    if (currentRole !== "agent") return deals;
    return deals.filter((d) => d.agent === currentAgentId || d.listingAgent === currentAgentId || d.sharedWithAgent === currentAgentId);
  }, [deals, currentRole, currentAgentId]);

  const fallenThroughDeals = useMemo(
    () => scopedDeals.filter((d) => d.conditionStatus === "Fallen through"),
    [scopedDeals]
  );

  // Five deal-tab sections. "Suspensive of Sale only Cash from Proceeds" doesn't
  // name-match any of the four requested buckets, so it's grouped in with
  // Awaiting Cash since it's fundamentally a cash-from-proceeds deal — flagged
  // in the UI note so it's not a silent decision. A deal that's actually
  // registered (Transfer Progress step 17) drops out of all four and moves
  // into its own Registered Deals section instead.
  const isDealRegistered = (d) => !!(d.transferSteps && d.transferSteps[16] && d.transferSteps[16].done);
  const dealsAboveLine = useMemo(() => scopedDeals.filter((d) => d.conditionStatus === "Above the line" && !isDealRegistered(d)), [scopedDeals]);
  const dealsBondOnly = useMemo(() => scopedDeals.filter((d) => d.conditionStatus === "Suspensive Bond" && !isDealRegistered(d)), [scopedDeals]);
  const dealsAwaitingCash = useMemo(
    () => scopedDeals.filter((d) => (d.conditionStatus === "Full Cash awaiting Cash" || d.conditionStatus === "Suspensive of Sale only Cash from Proceeds") && !isDealRegistered(d)),
    [scopedDeals]
  );
  const dealsSaleAndBond = useMemo(() => scopedDeals.filter((d) => d.conditionStatus === "Suspensive of Bond and Sale" && !isDealRegistered(d)), [scopedDeals]);
  const dealsRegistered = useMemo(() => scopedDeals.filter((d) => isDealRegistered(d)), [scopedDeals]);

  const markSaleConditionMet = (dealId) => updateDeal(dealId, "conditionStatus", "Suspensive Bond");

  let uidCounter = 0;
  const uid = (prefix) => prefix + "-" + Date.now() + "-" + (uidCounter++);

  const addActivity = (id, entry) => {
    const full = { id: uid("act"), timestamp: new Date(), author: currentAgentId, ...entry };
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, activity: [...(l.activity || []), full] } : l)));
    setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, activity: [...(prev.activity || []), full] } : prev));
    api.leads.addActivity(id, { type: full.type, text: full.text, authorId: full.author })
      .catch((e) => console.error("Failed to save lead activity", e));
  };

  const logSystemChange = (id, text) => addActivity(id, { type: "System", text, author: null });

  const handleLeadsImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        let added = 0, ownDuplicates = 0, flaggedForMerge = 0;
        const newLeads = [];
        const newMergeRequests = [];
        const currentLeadsSnapshot = [...leads];
        rows.forEach((row) => {
          const name = row.Name || row.name || "";
          const phone = row.Phone || row.phone || row["Contact Number"] || "";
          const email = row.Email || row.email || "";
          if (!name || (!phone && !email)) return;
          const match = findMatchingLead([...currentLeadsSnapshot, ...newLeads], phone, email);
          if (!match) {
            newLeads.push({
              name, phone, email,
              source: row.Source || row.source || "import",
              listingRef: row["Listing Ref"] || "",
              listingAddress: row["Listing Address"] || row.address || "",
              price: Number(row.Price || 0),
              message: row.Notes || row.Message || row.message || "",
              status: "New",
              agent: currentAgentId,
            });
            added++;
          } else if (match.agent === currentAgentId) {
            ownDuplicates++;
          } else {
            newMergeRequests.push({
              incoming: { name, phone, email, message: row.Notes || row.Message || row.message || "", source: row.Source || row.source || "import" },
              existingLeadId: match.id,
              requestingAgentId: currentAgentId,
              matchedAgentId: match.agent,
              matchReason: normalizePhone(phone) && normalizePhone(phone) === normalizePhone(match.phone) ? "phone" : "email",
            });
            flaggedForMerge++;
          }
        });
        if (newLeads.length) await api.leads.bulkInsertLeads(newLeads);
        if (newMergeRequests.length) {
          for (const mr of newMergeRequests) {
            const saved = await api.leads.createMergeRequest(mr);
            setMergeRequests((prev) => [...prev, saved]);
          }
          addTodo({
            agentId: currentAgentId,
            kind: "merge-review",
            label: newMergeRequests.length + " contact" + (newMergeRequests.length === 1 ? "" : "s") + " from " + agentName(currentAgentId) + "'s import need" + (newMergeRequests.length === 1 ? "s" : "") + " a merge decision",
          });
        }
        if (newLeads.length) setLeads(await api.leads.fetchLeads());
        setLeadsImportSummary({ added, ownDuplicates, flaggedForMerge, fileName: file.name });
      } catch (err) {
        setLeadsImportSummary({ error: true, fileName: file.name });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const approveMergeRequest = async (requestId) => {
    const req = mergeRequests.find((r) => r.id === requestId);
    if (!req) return;
    try {
      await api.leads.addCollaborator(req.existingLeadId, req.requestingAgentId);
      await api.leads.addActivity(req.existingLeadId, {
        type: "System",
        text: "Merged with a contact imported by " + agentName(req.requestingAgentId) + " (matched on " + req.matchReason + ") — approved by " + agentName(currentAgentId) + ". All original history kept; " + agentName(req.requestingAgentId) + " added as a collaborator.",
        authorId: null,
      });
      if (req.incoming.message) {
        await api.leads.addActivity(req.existingLeadId, { type: "Note", text: "From " + agentName(req.requestingAgentId) + "'s import: “" + req.incoming.message + "”", authorId: req.requestingAgentId });
      }
      await api.leads.resolveMergeRequest(requestId, "approved");
      setLeads(await api.leads.fetchLeads());
      setMergeRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r)));
      addTodo({
        agentId: req.requestingAgentId,
        leadId: req.existingLeadId,
        kind: "followup",
        label: "Your import for " + req.incoming.name + " was merged — you're now a collaborator on their contact card",
      });
    } catch (e) {
      alert("Couldn't approve merge request: " + e.message);
    }
  };

  const rejectMergeRequest = (requestId) => {
    setMergeRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r)));
    api.leads.resolveMergeRequest(requestId, "rejected").catch((e) => console.error("Failed to save merge rejection", e));
  };

  // --- Marketing ------------------------------------------------------------
  const campaignLeads = (campaignId) => leads.filter((l) => l.campaignId === campaignId);
  const campaignDeals = (campaignId) => {
    const ids = new Set(campaignLeads(campaignId).map((l) => l.id));
    return deals.filter((d) => d.leadId && ids.has(d.leadId));
  };
  const campaignStats = (c) => {
    const cLeads = campaignLeads(c.id);
    const cDeals = campaignDeals(c.id).filter((d) => CONDITION_GROUP[d.conditionStatus] !== "FallenThrough");
    const commission = cDeals.reduce((s, d) => s + (Number(d.confirmedCommission) || 0), 0);
    const spend = Number(c.spend) || 0;
    return {
      leads: cLeads.length,
      deals: cDeals.length,
      commission,
      costPerLead: cLeads.length ? spend / cLeads.length : 0,
      costPerDeal: cDeals.length ? spend / cDeals.length : 0,
      roi: spend > 0 ? commission / spend : 0,
      conversion: cLeads.length ? (cDeals.length / cLeads.length) * 100 : 0,
    };
  };
  const budgetStats = (budgetId) => {
    const camps = marketingCampaigns.filter((c) => c.budgetId === budgetId);
    const allocated = camps.reduce((s, c) => s + (Number(c.allocation) || 0), 0);
    const spent = camps.reduce((s, c) => s + (Number(c.spend) || 0), 0);
    return { campaignCount: camps.length, allocated, spent, names: camps.map((c) => c.name).join(", ") };
  };

  const addMarketingBudget = () => {
    if (!budgetFormDraft.name.trim()) return;
    api.marketing.addBudget({ ...budgetFormDraft, budget: Number(budgetFormDraft.budget) || 0 })
      .then((saved) => setMarketingBudgets((prev) => [...prev, saved]))
      .catch((e) => alert("Couldn't save budget: " + e.message));
    setBudgetFormDraft({ name: "", platform: "Meta", sector: marketingSectorView, startDate: "", endDate: "", budget: "" });
    setAddBudgetOpen(false);
  };
  const archiveMarketingBudget = (id) => {
    setMarketingBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, archived: true } : b)));
    api.marketing.updateBudget(id, { archived: true }).catch((e) => console.error("Failed to archive budget", e));
  };

  const saveCampaign = () => {
    if (!campaignFormDraft.name.trim() || !campaignFormDraft.budgetId) return;
    const payload = { ...campaignFormDraft, spend: Number(campaignFormDraft.spend) || 0, allocation: Number(campaignFormDraft.allocation) || 0, id: editCampaignId || undefined };
    api.marketing.saveCampaign(payload)
      .then((saved) => {
        if (editCampaignId) setMarketingCampaigns((prev) => prev.map((c) => (c.id === editCampaignId ? saved : c)));
        else setMarketingCampaigns((prev) => [...prev, saved]);
      })
      .catch((e) => alert("Couldn't save campaign: " + e.message));
    setCampaignFormDraft({ name: "", budgetId: "", platform: "Meta", sector: marketingSectorView, area: "East Rand", status: "Planned", spend: "", allocation: "", startDate: "", endDate: "", brokers: [] });
    setAddCampaignOpen(false);
    setEditCampaignId(null);
  };
  const archiveCampaign = (id) => {
    setMarketingCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, archived: true } : c)));
    const c = marketingCampaigns.find((x) => x.id === id);
    if (c) api.marketing.saveCampaign({ ...c, archived: true }).catch((e) => console.error("Failed to archive campaign", e));
  };

  const addToRotation = (agentId) => {
    if (!agentId || brokerRotation.includes(agentId)) return;
    const next = [...brokerRotation, agentId];
    setBrokerRotation(next);
    api.marketing.saveRotation({ agentIds: next, cursor: rotationCursor }).catch((e) => console.error("Failed to save rotation", e));
  };
  const removeFromRotation = (agentId) => {
    const next = brokerRotation.filter((id) => id !== agentId);
    setBrokerRotation(next);
    api.marketing.saveRotation({ agentIds: next, cursor: rotationCursor }).catch((e) => console.error("Failed to save rotation", e));
  };

  const assignCampaignLead = (campaignId, agentId, name, phone, email) => {
    if (!name.trim() || !agentId) return;
    const campaign = marketingCampaigns.find((c) => c.id === campaignId);
    api.leads.createLead({
      name: name.trim(), phone, email,
      source: (campaign?.platform || "campaign").toLowerCase().replace(/\s+/g, "-"),
      listingRef: "", listingAddress: campaign ? campaign.name : "", price: 0,
      message: "Assigned from marketing campaign: " + (campaign ? campaign.name : ""),
      status: "New", agent: agentId, campaignId,
    })
      .then(async (newLead) => {
        setLeads((prev) => [...prev, newLead]);
        await api.leads.addActivity(newLead.id, { type: "System", text: "Lead assigned from campaign “" + (campaign ? campaign.name : "") + "” by Marketing", authorId: null });
        await api.leads.logAllocation({ leadId: newLead.id, agentId, campaignId });
        setLeadAllocations((prev) => [{ id: uid("alloc"), leadId: newLead.id, leadName: newLead.name, agentId, campaignId, timestamp: new Date() }, ...prev]);
        addTodo({ agentId, leadId: newLead.id, kind: "followup", label: "New campaign lead — contact " + newLead.name + " (" + (campaign ? campaign.name : "campaign") + ")" });
      })
      .catch((e) => alert("Couldn't assign campaign lead: " + e.message));
  };

  const assignNextRoundRobin = (campaignId, name, phone, email) => {
    if (brokerRotation.length === 0) return;
    const agentId = brokerRotation[rotationCursor % brokerRotation.length];
    assignCampaignLead(campaignId, agentId, name, phone, email);
    const nextCursor = (rotationCursor + 1) % brokerRotation.length;
    setRotationCursor(nextCursor);
    api.marketing.saveRotation({ agentIds: brokerRotation, cursor: nextCursor }).catch((e) => console.error("Failed to save rotation cursor", e));
  };

  const updateStatus = (id, status) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    logSystemChange(id, "Stage changed to \u201c" + status + "\u201d");
    api.leads.updateLead(id, { status }).catch((e) => console.error("Failed to save lead status", e));
  };

  const assignAgent = (id, agent) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, agent } : l)));
    setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, agent } : prev));
    logSystemChange(id, "Assigned to " + agentName(agent));
    api.leads.updateLead(id, { agent_id: agent }).catch((e) => console.error("Failed to save lead agent", e));
  };

  const updateRequirements = (id, field, value) => {
    let mergedRequirements = null;
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      mergedRequirements = { ...l.requirements, [field]: value };
      return { ...l, requirements: mergedRequirements };
    }));
    setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, requirements: { ...prev.requirements, [field]: value } } : prev));
    const label = REQ_FIELD_LABELS[field] || field;
    const display = typeof value === "boolean" ? (value ? "Yes" : "No") : (field.toLowerCase().includes("price") || field === "maxBudget" ? fmtPrice(Number(value)) : String(value));
    logSystemChange(id, label + " updated to \u201c" + display + "\u201d");
    if (mergedRequirements) api.leads.updateLead(id, { requirements: mergedRequirements }).catch((e) => console.error("Failed to save requirements", e));
  };

  const toggleCollaborator = (id, agentId) => {
    let wasAdded = false;
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const has = l.collaborators.includes(agentId);
      wasAdded = !has;
      return { ...l, collaborators: has ? l.collaborators.filter((a) => a !== agentId) : [...l.collaborators, agentId] };
    }));
    setSelectedLead((prev) => {
      if (!prev || prev.id !== id) return prev;
      const has = prev.collaborators.includes(agentId);
      return { ...prev, collaborators: has ? prev.collaborators.filter((a) => a !== agentId) : [...prev.collaborators, agentId] };
    });
    const lead = leads.find((l) => l.id === id);
    const currentlyHas = lead && lead.collaborators.includes(agentId);
    logSystemChange(id, (!currentlyHas ? "Added " : "Removed ") + agentName(agentId) + (!currentlyHas ? " as a collaborator" : " from collaborators"));
    const call = currentlyHas ? api.leads.removeCollaborator(id, agentId) : api.leads.addCollaborator(id, agentId);
    call.catch((e) => console.error("Failed to save collaborator change", e));
  };

  const addTodo = (todo) => {
    const tempId = uid("todo");
    setTodos((prev) => [...prev, { id: tempId, done: false, createdAt: new Date(), agentId: todo.agentId || currentAgentId, ...todo }]);
    api.todos.addTodo({
      agentId: todo.agentId || currentAgentId, kind: todo.kind, label: todo.label,
      leadId: todo.leadId, dealId: todo.dealId, offerId: todo.offerId, canvassingRecordId: todo.canvassingRecordId,
      dueDate: todo.dueDate,
    })
      .then((saved) => { setTodos((prev) => prev.map((t) => (t.id === tempId ? { ...t, ...saved } : t))); pushTodoToMsToDo(saved.id); })
      .catch((e) => console.error("Failed to save todo", e));
  };

  const toggleTodo = (todoId) => {
    setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t)));
    const t = todos.find((x) => x.id === todoId);
    if (t) {
      api.todos.toggleTodo(todoId, !t.done).catch((e) => console.error("Failed to save todo", e));
      if (!t.done) completeTodoInMsToDo(todoId);
    }
  };

  const addNote = (leadId, draft) => {
    const lead = leads.find((l) => l.id === leadId) || selectedLead;
    if (!draft.text.trim() && draft.type !== "Viewing Booked") return;
    const listing = listingsData.find((l) => l.ref === draft.listingRef);

    addActivity(leadId, {
      type: draft.type,
      text: draft.text.trim() || (listing ? "Viewing booked at " + listing.address : ""),
      listingRef: draft.listingRef || null,
    });

    if (draft.type === "Viewing Booked" && listing) {
      addTodo({
        agentId: currentAgentId,
        leadId,
        leadName: lead ? lead.name : "",
        kind: "viewing-feedback",
        label: "Log feedback: viewing at " + listing.address + " with " + (lead ? lead.name : ""),
        listingRef: draft.listingRef,
      });
    }

    if (draft.type === "Viewing Feedback") {
      todos
        .filter((t) => t.leadId === leadId && t.kind === "viewing-feedback" && !t.done)
        .forEach((t) => toggleTodo(t.id));
    }
  };

  const addFollowUp = (leadId, reason, text) => {
    addActivity(leadId, { type: "Follow-up", text: reason + (text.trim() ? " — " + text.trim() : "") });
    const lead = leads.find((l) => l.id === leadId) || selectedLead;
    addTodo({
      agentId: currentAgentId,
      leadId,
      leadName: lead ? lead.name : "",
      kind: "followup",
      label: "Follow up (" + reason + ") with " + (lead ? lead.name : ""),
    });
  };

  const openDK = (dk) => {
    setSelectedDK(dk);
    setDkNoteDraft("");
    setDkFollowUpDraft(dk.followUpDate ? new Date(dk.followUpDate).toISOString().slice(0, 10) : "");
    setValuationDraft({ date: "", agent: currentAgentId, price: "", pdfName: "" });
  };

  const canvassingPatchToRow = (patch) => {
    const row = {};
    if ("status" in patch) row.status = patch.status;
    if ("archived" in patch) row.archived = patch.archived;
    if ("noInfoObtained" in patch) row.no_info_obtained = patch.noInfoObtained;
    if ("numberRequestTodoId" in patch) row.number_request_todo_id = patch.numberRequestTodoId;
    if ("followUpDate" in patch) row.follow_up_date = patch.followUpDate ? new Date(patch.followUpDate).toISOString().slice(0, 10) : null;
    if ("address" in patch) row.address = patch.address;
    if ("suburb" in patch) row.suburb = patch.suburb;
    if ("sellPrice" in patch) row.sell_price = patch.sellPrice || null;
    if ("marketingLink" in patch) row.marketing_link = patch.marketingLink;
    if ("ownerName" in patch) row.owner_name = patch.ownerName;
    if ("knownName" in patch) row.known_name = patch.knownName;
    if ("idNumber" in patch) row.id_number = patch.idNumber;
    if ("age" in patch) row.age = patch.age;
    if ("ownerPhone" in patch) row.owner_phone = patch.ownerPhone;
    if ("emailContactDetails" in patch) row.email = patch.emailContactDetails;
    if ("broker" in patch) row.broker_id = patch.broker;
    if ("erfRef" in patch) row.erf_ref = patch.erfRef;
    if ("erfSizeSqm" in patch) row.erf_size_sqm = patch.erfSizeSqm || null;
    return row;
  };

  const updateDK = (id, patch) => {
    setDoorKnocks((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    setSelectedDK((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    if (patch.valuation) {
      api.canvassing.saveValuation(id, { date: patch.valuation.date, agentId: patch.valuation.agent, price: patch.valuation.price })
        .catch((e) => console.error("Failed to save valuation", e));
    }
    const row = canvassingPatchToRow(patch);
    if (Object.keys(row).length) {
      api.canvassing.updateRecord(id, row).catch((e) => console.error("Failed to save canvassing record", e));
    }
  };

  const addDKNote = (id, text, type) => {
    if (!text.trim()) return;
    const entry = { id: uid("dkn"), text: text.trim(), author: currentAgentId, date: new Date(), type: type || "Note" };
    setDoorKnocks((prev) => prev.map((d) => (d.id === id ? { ...d, notes: [...d.notes, entry] } : d)));
    setSelectedDK((prev) => (prev && prev.id === id ? { ...prev, notes: [...prev.notes, entry] } : prev));
    api.canvassing.addNote(id, { text: text.trim(), type: type || "Note", authorId: currentAgentId })
      .catch((e) => console.error("Failed to save note", e));
  };

  const logCanvassingActivity = (dk, type) => {
    addDKNote(dk.id, type === "Call" ? "Cold call made" : "Door knocked", type);
  };

  const setDKStatus = (id, status) => {
    updateDK(id, { status });
    addDKNote(id, "Status changed to \u201c" + status + "\u201d");
  };

  const setDKFollowUp = (id, dateStr) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    updateDK(id, { followUpDate: d });
    addDKNote(id, "Follow-up date set to " + fmtDate(d));
  };

  const requestNumber = async (dk) => {
    updateDK(dk.id, { status: "Number Requested" });
    addDKNote(dk.id, "Number requested by " + agentName(currentAgentId) + " — sent to " + ADMIN_AGENT.name + " to look up");
    try {
      const saved = await api.todos.addTodo({
        agentId: ADMIN_AGENT_ID, kind: "canvas-number-request",
        label: "Look up contact details for " + dk.address + (dk.ownerName ? " (" + dk.ownerName + ")" : ""),
        canvassingRecordId: dk.id,
      });
      setTodos((prev) => [...prev, saved]);
      updateDK(dk.id, { numberRequestTodoId: saved.id });
      pushTodoToMsToDo(saved.id);
    } catch (e) {
      console.error("Failed to create number-request todo", e);
    }
  };

  const markMadeContact = (dk) => {
    updateDK(dk.id, { status: "Contacted" });
    addDKNote(dk.id, "Marked as Contacted — positive contact made");
  };

  const archiveDK = (dk) => {
    updateDK(dk.id, { archived: true });
    addDKNote(dk.id, "Archived");
  };

  const unarchiveDK = (dk) => {
    updateDK(dk.id, { archived: false });
    addDKNote(dk.id, "Unarchived");
  };

  const markNoInfoFound = (id) => {
    const dk = doorKnocks.find((d) => d.id === id);
    if (!dk) return;
    updateDK(id, { noInfoObtained: true });
    addDKNote(id, "No information could be obtained by " + ADMIN_AGENT.name + " — kept on file under Contacts");
    if (dk.numberRequestTodoId) toggleTodo(dk.numberRequestTodoId);
  };

  const saveDKEdit = (id, patch) => {
    const dk = doorKnocks.find((d) => d.id === id);
    if (!dk) return;
    const gainedNumber = !dk.ownerPhone && patch.ownerPhone;
    const wasWaiting = dk.status === "Number Requested";
    const next = { ...patch };
    next.followUpDate = patch.followUpDate ? new Date(patch.followUpDate) : dk.followUpDate;
    if (gainedNumber && wasWaiting) {
      next.status = "Uncontacted";
      next.noInfoObtained = false;
    }
    updateDK(id, next);
    addDKNote(id, "Record details updated" + (gainedNumber && wasWaiting ? " — info sent to " + agentName(dk.broker || dk.agent) : ""));
    if (gainedNumber && wasWaiting) {
      if (dk.numberRequestTodoId) toggleTodo(dk.numberRequestTodoId);
      addTodo({
        agentId: dk.broker || dk.agent,
        canvassingRecordId: id,
        kind: "canvas-call",
        label: "Call " + (dk.ownerName || "owner") + " at " + dk.address + " to canvas for a valuation",
      });
    }
  };

  const addManualCanvasRecord = (data) => {
    if (isDuplicateCanvasRecord(doorKnocks, data.address, data.ownerPhone)) {
      window.alert("A record already exists for this address or contact number — not adding a duplicate.");
      return false;
    }
    api.canvassing.addRecord({
      address: data.address || "", sellPrice: data.sellPrice || 0, marketingLink: data.marketingLink || "",
      suburb: data.suburb || "", ownerName: data.ownerName || "", ownerPhone: data.ownerPhone || "",
      emailContactDetails: data.emailContactDetails || "", broker: currentAgentId,
      followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().slice(0, 10) : null,
      status: "Uncontacted",
    })
      .then((saved) => {
        setDoorKnocks((prev) => [...prev, saved]);
        return api.canvassing.addNote(saved.id, { text: "Record created", type: "Note", authorId: currentAgentId });
      })
      .then(() => api.canvassing.fetchCanvassingRecords())
      .then((rows) => setDoorKnocks(rows))
      .catch((e) => alert("Couldn't save canvassing record: " + e.message));
    return true;
  };

  const [canvasImportSummary, setCanvasImportSummary] = useState(null);
  const handleCanvasImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        let added = 0, skipped = 0;
        const known = [...doorKnocks];
        const toInsert = [];
        rows.forEach((row) => {
          const address = row.Address || row.address || "";
          const ownerPhone = row["Contact Details"] || row.contactDetails || row.Phone || "";
          if (!address || isDuplicateCanvasRecord(known, address, ownerPhone)) { skipped++; return; }
          const rec = {
            address,
            sellPrice: Number(row["Sell Price"] || row.sellPrice || row["Current Marketing Price"] || 0),
            marketingLink: row["Marketing Link"] || row.marketingLink || "",
            suburb: row.Suburb || row.suburb || "",
            ownerName: row.Name || row.ownerName || "",
            ownerPhone,
            emailContactDetails: row["Email / Contact Details"] || row.email || "",
            broker: currentAgentId, status: "Uncontacted",
          };
          known.push(rec);
          toInsert.push(rec);
          added++;
        });
        if (toInsert.length) await api.canvassing.bulkInsertRecords(toInsert);
        const refreshed = await api.canvassing.fetchCanvassingRecords();
        setDoorKnocks(refreshed);
        setCanvasImportSummary({ added, skipped });
      } catch (err) {
        setCanvasImportSummary({ added: 0, skipped: 0, error: true });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveValuation = (id) => {
    if (!valuationDraft.price || !valuationDraft.date) return;
    const valuation = {
      date: new Date(valuationDraft.date),
      agent: valuationDraft.agent,
      price: Number(valuationDraft.price),
      pdfName: valuationDraft.pdfName,
    };
    updateDK(id, { valuation, status: "Contacted" });
    addDKNote(
      id,
      "Valuation captured: " + fmtPrice(valuation.price) + " by " + agentName(valuation.agent) +
      (valuation.pdfName ? " (report: " + valuation.pdfName + ")" : "")
    );
  };

  const convertDKToListing = (dk) => {
    if (!dk.valuation) return;
    const newListing = {
      id: "L-DK-" + dk.id.replace(/\W/g, "").slice(0, 24),
      ref: "PD-DK" + dk.id.replace(/\D/g, "").slice(0, 8),
      address: dk.address,
      suburb: dk.suburb,
      price: dk.valuation.price,
      type: "House",
      beds: 3,
      baths: 2,
      parking: 2,
      status: "Active",
      agent: dk.agent,
      portals: [],
      fromCanvassing: true,
    };
    api.listings.addListing(newListing)
      .then((saved) => setListingsData((prev) => [...prev, saved]))
      .catch((e) => console.error("Failed to save listing", e));
    updateDK(dk.id, { status: "Listed Buildings" });
    addDKNote(dk.id, "Converted to listing " + newListing.ref + " and pushed toward Propdata sync", "Listing");
  };

  const [drawerTab, setDrawerTab] = useState("enquiry");
  const openLead = (l) => {
    setSelectedLead(l);
    setDrawerTab("enquiry");
  };

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = leads.filter((l) => {
      const d = new Date(l.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
    const active = listingsData.filter((l) => l.status === "Active").length;
    const underOffer = listingsData.filter((l) => l.status === "Under Offer").length;
    const soldValue = listingsData.filter((l) => l.status === "Sold").reduce((s, l) => s + l.price, 0);
    return { newToday, active, underOffer, soldValue };
  }, [leads, listingsData]);

  const sourceCounts = useMemo(() => {
    const c = { Property24: 0, PrivateProperty: 0, Website: 0 };
    leads.forEach((l) => (c[l.source] += 1));
    return c;
  }, [leads]);

  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1);

  const [todoFilter, setTodoFilter] = useState("all");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskDraft, setAddTaskDraft] = useState({ agentId: "", kind: "followup", label: "", dueDate: "" });
  const openAddTask = () => {
    setAddTaskDraft({ agentId: currentAgentId, kind: "followup", label: "", dueDate: "" });
    setAddTaskOpen(true);
  };
  const submitAddTask = () => {
    if (!addTaskDraft.label.trim()) return;
    addTodo({
      agentId: addTaskDraft.agentId || currentAgentId,
      kind: addTaskDraft.kind,
      label: addTaskDraft.label.trim(),
      dueDate: addTaskDraft.dueDate || null,
    });
    setAddTaskOpen(false);
  };

  const todoEffectiveDate = (t) => (t.dueDate ? new Date(t.dueDate) : t.createdAt);

  const isTodoOverdue = (t) => {
    if (t.done || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  };

  const daysOverdue = (t) => {
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((today - due) / 86400000);
  };

  const inTodoRange = (t, filter) => {
    if (filter === "all") return true;
    const dd = new Date(todoEffectiveDate(t));
    dd.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (filter === "today") return dd <= today;
    if (filter === "week") {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + (6 - today.getDay()));
      return dd <= weekEnd;
    }
    if (filter === "month") {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return dd <= monthEnd;
    }
    return true;
  };

  const myOpenTodos = useMemo(
    () => todos
      .filter((t) => t.agentId === currentAgentId && !t.done)
      .filter((t) => inTodoRange(t, todoFilter))
      .sort((a, b) => todoEffectiveDate(a) - todoEffectiveDate(b)),
    [todos, currentAgentId, todoFilter]
  );
  const myOpenTodosTotal = useMemo(
    () => todos.filter((t) => t.agentId === currentAgentId && !t.done).length,
    [todos, currentAgentId]
  );
  const myDoneTodos = useMemo(
    () => todos.filter((t) => t.agentId === currentAgentId && t.done).sort((a, b) => b.createdAt - a.createdAt),
    [todos, currentAgentId]
  );
  // Every open task across every agent — masterAdmin/officeManager only,
  // so assigning a task to someone else (via "+ Add task") is actually
  // visible to whoever allocated it, not just to the assignee.
  const allOpenTodos = useMemo(
    () => todos.filter((t) => !t.done).sort((a, b) => todoEffectiveDate(a) - todoEffectiveDate(b)),
    [todos]
  );

  const agentPipeline = useMemo(() => {
    return agentsList.filter((a) => !a.excludeFromLeaderboard).map((a) => {
      const mine = leads.filter((l) => l.agent === a.id);
      const byStage = {};
      STAGES.forEach((s) => (byStage[s] = mine.filter((l) => l.status === s).length));
      const active = mine.filter((l) => !["Sold", "Lost"].includes(l.status));
      const pipelineValue = active.reduce((sum, l) => sum + l.price, 0);
      const soldCount = byStage["Sold"];
      const lostCount = byStage["Lost"];
      const closedTotal = soldCount + lostCount;
      const winRate = closedTotal > 0 ? Math.round((soldCount / closedTotal) * 100) : null;
      return { agent: a, byStage, activeCount: active.length, pipelineValue, winRate, totalLeads: mine.length };
    });
  }, [leads]);

  useEffect(() => {
    setDeals((prev) => {
      const existingLeadIds = new Set(prev.map((d) => d.leadId));
      const additions = leads
        .filter((l) => l.status === "Sold" && !existingLeadIds.has(l.id))
        .map((l) => {
          const listing = listingsData.find((x) => x.ref === l.listingRef);
          const asking = listing ? listing.price : l.price;
          const openingOffer = Math.round((asking * 0.93) / 10000) * 10000;
          const agreedOffer = Math.round((asking * 0.97) / 10000) * 10000;
          const comPercent = 5;
          const confirmedCommission = (agreedOffer * comPercent) / 100;
          return {
            id: uid("deal"),
            leadId: l.id,
            month: monthYearLabel(l.date),
            property: l.listingAddress.split(",")[0],
            suburb: listing ? listing.suburb : "",
            askingPrice: asking,
            openingOffer,
            conditions: "Subject to bond approval",
            bondThrough: "Pending",
            bondApplyingFor: 0,
            att: "",
            coSeller: "",
            coBuyers: "",
            cco: "",
            agreedOffer,
            sharedDeal: "No",
            comPercent,
            confirmedCommission,
            suspensive: 0,
            fallOut: 0,
            kreNettConfirmed: 0,
            kreNettSus: 0,
            nettToKRE: 0,
            stillToRegister: "Yes",
            expRegDate: "",
            dealStatus: agentTier(l.agent),
            agent: l.agent,
            listingAgent: l.agent,
            sharedWithAgent: "",
            sharedSplit: "",
            conditionStatus: "Above the line",
            transferSteps: buildDefaultTransferSteps(),
            activity: [{ id: uid("act"), type: "System", text: "Deal created", author: null, timestamp: new Date() }],
            offerId: null,
            buyerEmail: "",
            buyerName: "",
            sellerEmail: "",
            sellerName: "",
            otpFileName: "",
            otpFileData: "",

            commStatementFileName: "",
            commStatementFileData: "",
            otpSentBuyer: false,
            otpSentSeller: false,
            otpSentAttorney: false,
            otpTodoId: null,
          };
        });
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [leads, listingsData]);

  useEffect(() => {
    setOffers((prev) => {
      const existingLeadIds = new Set(prev.map((o) => o.leadId));
      const additions = leads
        .filter((l) => l.status === "Offer Made" && !existingLeadIds.has(l.id))
        .map((l) => {
          const listing = listingsData.find((x) => x.ref === l.listingRef);
          const asking = listing ? listing.price : l.price;
          const offerMade = Math.round((asking * 0.92) / 10000) * 10000;
          return {
            id: uid("offer"),
            leadId: l.id,
            dealId: null,
            month: monthYearLabel(l.date),
            property: l.listingAddress.split(",")[0],
            suburb: listing ? listing.suburb : "",
            askingPrice: asking,
            offerMade,
            conditions: "Subject to bond approval",
            sellerCounterOffer: 0,
            buyerCounterOffer: 0,
            agreed: "Pending",
            agreedPrice: 0,
            agent: l.agent,
            listingAgent: l.agent,
            buyerName: l.name || "",
            sellerName: "",
            sharedDeal: "No",
            sharedWithAgent: "",
            sharedSplit: "",
            comPercent: 5,
            activity: [{ id: uid("oact"), type: "System", text: "Offer created from lead reaching \u201cOffer Made\u201d", author: null, timestamp: new Date() }],
          };
        });
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [leads, listingsData]);

  const DEAL_FIELD_TO_COLUMN = {
    agent: "agent_id", property: "property", dealStatus: "deal_tier", conditionStatus: "condition_status",
    month: "month", suburb: "suburb", askingPrice: "asking_price", openingOffer: "opening_offer",
    conditions: "conditions", bondThrough: "bond_through", bondApplyingFor: "bond_applying_for", att: "attorney",
    listingAgent: "listing_agent_id", agreedOffer: "agreed_offer", sharedDeal: "shared_deal",
    sharedWithAgent: "shared_with_agent_id", sharedSplit: "shared_split", comPercent: "com_percent",
    confirmedCommission: "confirmed_commission", expRegDate: "exp_reg_date",
    buyerName: "buyer_name", sellerName: "seller_name", buyerEmail: "buyer_email", sellerEmail: "seller_email",
    buyerContactId: "buyer_contact_id", sellerContactId: "seller_contact_id",
    deposit: "deposit", occupationDate: "occupation_date", occupationalRental: "occupational_rental",
    financeRequired: "finance_required", cashPortion: "cash_portion", buyerPhone: "buyer_phone", sellerPhone: "seller_phone",
    aboveLineNotes: "above_line_notes",
  };

  const updateDeal = (id, field, value) => {
    const isMoney = MONEY_FIELDS.includes(field);
    const v = isMoney || field === "comPercent" ? Number(value) : value;
    let recomputedCommission = null;
    setDeals((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const next = { ...d, [field]: v };
      if (field === "agreedOffer" || field === "comPercent") {
        next.confirmedCommission = (Number(next.agreedOffer) || 0) * (Number(next.comPercent) || 0) / 100;
        recomputedCommission = next.confirmedCommission;
      }
      return next;
    }));
    const column = DEAL_FIELD_TO_COLUMN[field];
    if (column) {
      const patch = { [column]: v === "" ? null : v };
      if (recomputedCommission !== null) patch.confirmed_commission = recomputedCommission;
      api.deals.updateDeal(id, patch).catch((e) => console.error("Failed to save deal", e));
    }
  };

  const OFFER_MONEY_FIELDS = ["askingPrice", "offerMade", "sellerCounterOffer", "buyerCounterOffer", "agreedPrice", "deposit", "occupationalRental", "cashPortion"];

  const OFFER_FIELD_TO_COLUMN = {
    agent: "agent_id",
    month: "month", property: "property", suburb: "suburb", askingPrice: "asking_price", offerMade: "offer_made",
    conditions: "conditions", sellerCounterOffer: "seller_counter_offer", buyerCounterOffer: "buyer_counter_offer",
    agreedPrice: "agreed_price", buyerName: "buyer_name", sellerName: "seller_name",
    buyerContactId: "buyer_contact_id", sellerContactId: "seller_contact_id",
    listingAgent: "listing_agent_id", sharedDeal: "shared_deal", sharedWithAgent: "shared_with_agent_id",
    sharedSplit: "shared_split", comPercent: "com_percent",
    deposit: "deposit", occupationDate: "occupation_date", occupationalRental: "occupational_rental",
    financeRequired: "finance_required", cashPortion: "cash_portion", bondOriginator: "bond_originator",
    conveyancer: "conveyancer", buyerPhone: "buyer_phone", sellerPhone: "seller_phone",
  };

  const addOfferActivity = (offerId, entry) => {
    const full = { id: uid("oact"), timestamp: new Date(), author: currentAgentId, ...entry };
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, activity: [...(o.activity || []), full] } : o)));
    api.offers.addActivity(offerId, { type: full.type, text: full.text, authorId: full.author })
      .catch((e) => console.error("Failed to save offer activity", e));
  };

  const logOfferSystemChange = (offerId, text) => addOfferActivity(offerId, { type: "System", text, author: null });

  const updateOffer = (id, field, value) => {
    const v = OFFER_MONEY_FIELDS.includes(field) || field === "comPercent" ? Number(value) : value;
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: v } : o)));
    const column = OFFER_FIELD_TO_COLUMN[field];
    if (column) api.offers.updateOffer(id, { [column]: v === "" ? null : v }).catch((e) => console.error("Failed to save offer", e));
    const label = OFFER_FIELD_LABELS[field];
    if (label) {
      const display = OFFER_MONEY_FIELDS.includes(field) ? fmtPrice(Number(value) || 0) : (String(value).trim() || "—");
      logOfferSystemChange(id, label + " updated to \u201c" + display + "\u201d");
    }
  };

  const addOfferNote = (offerId, text) => {
    if (!text.trim()) return;
    addOfferActivity(offerId, { type: "Note", text: text.trim() });
  };

  const addOfferFollowUp = (offerId, reason, dueDateStr, note) => {
    const offer = offers.find((o) => o.id === offerId);
    addOfferActivity(offerId, {
      type: "Follow-up",
      text: reason + (note.trim() ? " — " + note.trim() : "") + (dueDateStr ? " (due " + fmtDate(new Date(dueDateStr)) + ")" : ""),
    });
    addTodo({
      agentId: offer ? offer.agent : currentAgentId,
      offerId,
      leadName: offer ? (offer.buyerName || offer.property) : "",
      kind: "followup",
      label: "Follow up (" + reason + ") — " + (offer ? offer.property : "this offer"),
      dueDate: dueDateStr || null,
    });
  };

  const addOfferMeeting = (offerId, dateStr, notes) => {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer || !dateStr) return;
    const link = buildOfferMeetingOutlookLink(offer, dateStr, notes);
    window.open(link, "_blank");
    addOfferActivity(offerId, {
      type: "Meeting",
      text: "Meeting scheduled for " + fmtDate(new Date(dateStr)) + (notes.trim() ? " — " + notes.trim() : ""),
    });
    const feedbackDue = new Date(dateStr);
    feedbackDue.setDate(feedbackDue.getDate() + 1);
    addTodo({
      agentId: offer.agent,
      offerId,
      leadName: offer.buyerName || offer.property,
      kind: "meeting-feedback",
      label: "Give feedback on the meeting held for " + (offer.property || "this offer"),
      dueDate: feedbackDue.toISOString().slice(0, 10),
    });
  };

  const addManualOffer = (agentOverride) => {
    const agentId = agentOverride || currentAgentId;
    api.offers.createOffer({
      leadId: null, month: monthYearLabel(new Date()),
      property: "", suburb: "", askingPrice: 0, offerMade: 0, conditions: "",
      sellerCounterOffer: 0, buyerCounterOffer: 0, agreed: "Pending", agreedPrice: 0,
      agent: agentId, listingAgent: agentId, buyerName: "", sellerName: "",
      sharedDeal: "No", sharedWithAgent: "", sharedSplit: "", comPercent: 5,
    })
      .then((saved) => {
        setOffers((prev) => [...prev, saved]);
        return api.offers.addActivity(saved.id, { type: "System", text: "Offer created", authorId: null });
      })
      .catch((e) => alert("Couldn't create offer: " + e.message));
  };

  const removeOffer = (id) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    api.offers.deleteOffer(id).catch((e) => console.error("Failed to delete offer", e));
  };

  // --- Rentals ------------------------------------------------------------
  const RENTAL_MONEY_FIELDS = ["monthlyRental", "findersFee", "monthlyManagementFee"];
  const RENTAL_OFFER_FIELD_TO_COLUMN = {
    agent: "agent_id", listingAgent: "listing_agent_id", sharedWithAgent: "shared_with_agent_id", sharedSplit: "shared_split",
    month: "month", property: "property", suburb: "suburb", conditions: "conditions",
    landlordName: "landlord_name", landlordPhone: "landlord_phone", landlordContactId: "landlord_contact_id",
    tenantName: "tenant_name", tenantPhone: "tenant_phone", tenantContactId: "tenant_contact_id",
    monthlyRental: "monthly_rental", findersFee: "finders_fee", termOfLeaseMonths: "term_of_lease_months", managed: "managed",
  };
  const RENTAL_DEAL_FIELD_TO_COLUMN = {
    agent: "agent_id", listingAgent: "listing_agent_id", sharedWithAgent: "shared_with_agent_id", sharedSplit: "shared_split",
    month: "month", property: "property", suburb: "suburb",
    landlordName: "landlord_name", landlordPhone: "landlord_phone", landlordContactId: "landlord_contact_id",
    tenantName: "tenant_name", tenantPhone: "tenant_phone", tenantContactId: "tenant_contact_id",
    monthlyRental: "monthly_rental", findersFee: "finders_fee", termOfLeaseMonths: "term_of_lease_months", managed: "managed",
    adminFeePaid: "admin_fee_paid", monthlyManagementFee: "monthly_management_fee", monthlyInspections: "monthly_inspections",
    signedLease: "signed_lease", moveInDate: "move_in_date", status: "status",
  };

  const addManualRentalOffer = (agentOverride) => {
    // currentAgentId is never a real rental agent — only masterAdmin/
    // officeManager ever reach this button, and they aren't on the
    // rental roster. Defaulting to it left new offers with a null
    // agent_id that the dropdown then displayed misleadingly (showed
    // the first agent's name without actually selecting them).
    const agentId = agentOverride || rentalAgentsList[0]?.id || "";
    api.rentalOffers.createRentalOffer({
      month: monthYearLabel(new Date()),
      property: "", suburb: "", landlordName: "", tenantName: "",
      monthlyRental: 0, findersFee: 0, managed: true, conditions: "",
      agent: agentId, listingAgent: agentId, sharedWithAgent: "", sharedSplit: "", status: "Pending",
    })
      .then((saved) => {
        setRentalOffers((prev) => [...prev, saved]);
        return api.rentalOffers.addActivity(saved.id, { type: "System", text: "Rental offer created" });
      })
      .catch((e) => alert("Couldn't create rental offer: " + e.message));
  };

  const removeRentalOffer = (id) => {
    setRentalOffers((prev) => prev.filter((o) => o.id !== id));
    api.rentalOffers.deleteRentalOffer(id).catch((e) => console.error("Failed to delete rental offer", e));
  };

  const updateRentalOffer = (id, field, value) => {
    const v = RENTAL_MONEY_FIELDS.includes(field) ? Number(value) : value;
    setRentalOffers((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: v } : o)));
    const column = RENTAL_OFFER_FIELD_TO_COLUMN[field];
    if (column) api.rentalOffers.updateRentalOffer(id, { [column]: v === "" ? null : v }).catch((e) => console.error("Failed to save rental offer", e));
  };

  const convertRentalOfferToDeal = async (offer) => {
    const newDeal = {
      rentalOfferId: offer.id, month: offer.month, property: offer.property, suburb: offer.suburb,
      landlordName: offer.landlordName, landlordPhone: offer.landlordPhone, landlordContactId: offer.landlordContactId,
      tenantName: offer.tenantName, tenantPhone: offer.tenantPhone, tenantContactId: offer.tenantContactId,
      monthlyRental: offer.monthlyRental, findersFee: offer.findersFee, termOfLeaseMonths: offer.termOfLeaseMonths,
      managed: offer.managed, agent: offer.agent, listingAgent: offer.listingAgent,
      sharedWithAgent: offer.sharedWithAgent, sharedSplit: offer.sharedSplit, status: "Active",
    };
    const saved = await api.rentalDeals.createRentalDeal(newDeal);
    setRentalDeals((prev) => [...prev, saved]);
    await api.rentalDeals.addActivity(saved.id, "Deal created from accepted rental offer");
    return saved.id;
  };

  const setRentalOfferStatus = async (id, status) => {
    const offer = rentalOffers.find((o) => o.id === id);
    if (!offer) return;
    if (status === "Yes" && !offer.dealId) {
      try {
        const newDealId = await convertRentalOfferToDeal(offer);
        await api.rentalOffers.updateRentalOffer(id, { status: "Yes", deal_id: newDealId });
        setRentalOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Yes", dealId: newDealId } : o)));
      } catch (e) {
        alert("Couldn't convert rental offer to a deal: " + e.message);
      }
    } else {
      updateRentalOffer(id, "status", status);
    }
  };

  const updateRentalDeal = (id, field, value) => {
    const v = RENTAL_MONEY_FIELDS.includes(field) ? Number(value) : value;
    setRentalDeals((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: v } : d)));
    const column = RENTAL_DEAL_FIELD_TO_COLUMN[field];
    if (column) api.rentalDeals.updateRentalDeal(id, { [column]: v === "" ? null : v }).catch((e) => console.error("Failed to save rental deal", e));
  };

  const removeRentalDeal = (id) => {
    setRentalDeals((prev) => prev.filter((d) => d.id !== id));
    api.rentalDeals.deleteRentalDeal(id).catch((e) => console.error("Failed to delete rental deal", e));
  };

  const addRentalAgentRow = () => {
    const name = prompt("New rental agent's name?");
    if (!name || !name.trim()) return;
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "agent-" + Date.now();
    const initials = name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    api.rentalAgents.createRentalAgent({ id, name: name.trim(), initials })
      .then((saved) => setRentalAgentsList((prev) => [...prev, saved]))
      .catch((e) => alert("Couldn't add rental agent: " + e.message));
  };

  const updateRentalAgentField = (id, field, value) => {
    setRentalAgentsList((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
    api.rentalAgents.updateRentalAgent(id, { [field]: value }).catch((e) => console.error("Failed to save rental agent", e));
  };

  const handleUploadRentalAgentPhoto = (id, file) => {
    if (!file) return;
    api.rentalAgents.uploadRentalAgentPhoto(id, file)
      .then((saved) => setRentalAgentsList((prev) => prev.map((a) => (a.id === id ? saved : a))))
      .catch((e) => alert("Couldn't upload photo: " + e.message));
  };

  const setRentalAgentActive = (id, active) => {
    setRentalAgentsList((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
    api.rentalAgents.updateRentalAgent(id, { active }).catch((e) => console.error("Failed to save rental agent", e));
  };

  const [rentalDealDrawerId, setRentalDealDrawerId] = useState(null);
  const [rentalOfferDrawerId, setRentalOfferDrawerId] = useState(null);

  const rentalLeaderboard = useMemo(() => {
    const byAgent = {};
    rentalAgentsList.filter((a) => a.active !== false).forEach((a) => { byAgent[a.id] = 0; });
    rentalDeals.forEach((d) => {
      if (d.status === "Fallen Through") return;
      const fee = Number(d.findersFee) || 0;
      if (d.sharedWithAgent && d.sharedSplit) {
        const [p1, p2] = d.sharedSplit.split("/").map(Number);
        if (byAgent[d.agent] !== undefined) byAgent[d.agent] += fee * ((p1 || 0) / 100);
        if (byAgent[d.sharedWithAgent] !== undefined) byAgent[d.sharedWithAgent] += fee * ((p2 || 0) / 100);
      } else if (byAgent[d.agent] !== undefined) {
        byAgent[d.agent] += fee;
      }
    });
    return rentalAgentsList
      .filter((a) => a.active !== false)
      .map((a) => ({ agent: a, total: byAgent[a.id] || 0, deals: rentalDeals.filter((d) => d.agent === a.id && d.status !== "Fallen Through").length }))
      .sort((a, b) => b.total - a.total);
  }, [rentalAgentsList, rentalDeals]);

  const [offerImportSummary, setOfferImportSummary] = useState(null);
  const resolveAgentByName = (name) => {
    const n = String(name || "").trim().toLowerCase();
    if (!n) return "";
    const exact = agentsList.find((a) => a.name.toLowerCase() === n);
    if (exact) return exact.id;
    const partial = agentsList.find((a) => a.name.toLowerCase().includes(n) || n.includes(a.name.toLowerCase()));
    return partial ? partial.id : "";
  };

  const handleOffersImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const existingSigs = new Set(offers.map(offerSignature));
        const newOffers = [];
        const unknownAgents = new Set();
        let added = 0, skipped = 0, missingAgent = 0;

        rawRows.forEach((row) => {
          const rec = {};
          Object.keys(row).forEach((h) => {
            const key = OFFER_IMPORT_HEADER_MAP[normalizeHeader(h)];
            if (key) rec[key] = row[h];
          });
          if (!rec.property || !String(rec.property).trim()) return;

          const agentId = resolveAgentByName(rec.agent);
          if (!agentId) { missingAgent++; if (rec.agent) unknownAgents.add(String(rec.agent).trim()); return; }
          const listingAgentId = rec.listingAgent ? (resolveAgentByName(rec.listingAgent) || agentId) : agentId;
          const sharedWithAgentId = rec.sharedWithAgent ? resolveAgentByName(rec.sharedWithAgent) : "";

          const offer = { agent: agentId, listingAgent: listingAgentId, sharedWithAgent: sharedWithAgentId };
          ["property", "suburb", "conditions", "buyerName", "sellerName", "sharedDeal", "sharedSplit"].forEach((f) => {
            offer[f] = rec[f] !== undefined && rec[f] !== "" ? String(rec[f]).trim() : "";
          });
          offer.agreed = rec.agreed && String(rec.agreed).trim() ? String(rec.agreed).trim() : "Pending";
          ["askingPrice", "offerMade", "sellerCounterOffer", "buyerCounterOffer", "agreedPrice"].forEach((f) => {
            const n = Number(rec[f]);
            offer[f] = rec[f] === undefined || rec[f] === "" || Number.isNaN(n) ? 0 : n;
          });
          const comN = Number(rec.comPercent);
          offer.comPercent = rec.comPercent === undefined || rec.comPercent === "" || Number.isNaN(comN) ? 5 : comN;

          const sig = offerSignature(offer);
          if (existingSigs.has(sig)) { skipped++; return; }
          existingSigs.add(sig);
          newOffers.push(offer);
          added++;
        });

        if (newOffers.length) {
          await api.offers.bulkInsertOffers(newOffers);
          setOffers(await api.offers.fetchOffers());
        }
        setOfferImportSummary({
          added, skipped, missingAgent, fileName: file.name,
          unknownAgents: [...unknownAgents].slice(0, 5),
        });
      } catch (err) {
        setOfferImportSummary({ error: "Couldn't read “" + file.name + "” — check it's a valid .xlsx/.csv export.", fileName: file.name });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const convertOfferToDeal = async (offer) => {
    const price = offer.agreedPrice || offer.buyerCounterOffer || offer.sellerCounterOffer || offer.offerMade || 0;
    const comPercent = offer.comPercent || 5;
    const newDeal = {
      leadId: offer.leadId,
      offerId: offer.id,
      // The deal's month drives every period filter in the app
      // (leaderboard, dashboard, targets) — carry over whatever the agent
      // picked on the offer; fall back to today only for offers created
      // before the Month field existed.
      month: offer.month || monthYearLabel(new Date()),
      property: offer.property,
      suburb: offer.suburb,
      askingPrice: offer.askingPrice,
      openingOffer: offer.offerMade,
      conditions: offer.conditions || "Subject to bond approval",
      bondThrough: "Pending",
      bondApplyingFor: 0,
      att: "",
      coSeller: "",
      coBuyers: "",
      cco: "",
      agreedOffer: price,
      sharedDeal: offer.sharedDeal || "No",
      comPercent,
      confirmedCommission: (price * comPercent) / 100,
      suspensive: 0,
      fallOut: 0,
      kreNettConfirmed: 0,
      kreNettSus: 0,
      nettToKRE: 0,
      stillToRegister: "Yes",
      expRegDate: "",
      dealStatus: agentTier(offer.agent),
      agent: offer.agent,
      listingAgent: offer.listingAgent,
      sharedWithAgent: offer.sharedWithAgent || "",
      sharedSplit: offer.sharedSplit || "",
      conditionStatus: "Suspensive Bond",
      buyerName: offer.buyerName || "",
      sellerName: offer.sellerName || "",
      buyerContactId: offer.buyerContactId || "",
      sellerContactId: offer.sellerContactId || "",
      otpSentBuyer: false,
      otpSentSeller: false,
      otpSentAttorney: false,
    };
    const saved = await api.deals.createDeal(newDeal);
    setDeals((prev) => [...prev, { ...saved, transferSteps: TRANSFER_STEPS.map((label, i) => ({ key: "step" + i, label, done: false, dateCompleted: "" })) }]);
    await api.deals.addActivity(saved.id, "Deal created");
    const otpTodo = await api.todos.addTodo({
      agentId: ADMIN_AGENT_ID, dealId: saved.id,
      kind: "otp-send",
      label: "Send Offer to Purchase to buyer, seller, and attorney for " + (offer.property || "this deal"),
    });
    setTodos((prev) => [...prev, otpTodo]);
    await api.deals.updateDeal(saved.id, { otp_todo_id: otpTodo.id });
    pushTodoToMsToDo(otpTodo.id);
    return saved.id;
  };

  const setOfferAgreed = async (id, agreed) => {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;
    if (agreed === "Yes" && !offer.dealId) {
      const price = offer.agreedPrice || offer.buyerCounterOffer || offer.sellerCounterOffer || offer.offerMade || 0;
      const updatedOffer = { ...offer, agreed, agreedPrice: price };
      try {
        const newDealId = await convertOfferToDeal(updatedOffer);
        await api.offers.updateOffer(id, { agreed: "Yes", agreed_price: price, deal_id: newDealId });
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...updatedOffer, dealId: newDealId } : o)));
        logOfferSystemChange(id, "Agreed: Yes — converted to a deal");
      } catch (e) {
        alert("Couldn't convert offer to a deal: " + e.message);
      }
    } else {
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, agreed } : o)));
      api.offers.updateOffer(id, { agreed }).catch((e) => console.error("Failed to save offer", e));
      logOfferSystemChange(id, "Status changed to “" + (agreed === "No" ? "No Deal" : agreed) + "”");
    }
  };

  const [otpDealId, setOtpDealId] = useState(null);
  const [offerDrawerId, setOfferDrawerId] = useState(null);
  const [offerNoteDraft, setOfferNoteDraft] = useState("");
  const [offerFollowUpDraft, setOfferFollowUpDraft] = useState({ reason: OFFER_FOLLOWUP_OPTIONS[0], date: "", note: "" });
  const [offerMeetingDraft, setOfferMeetingDraft] = useState({ date: "", notes: "" });
  const [negotiationDraft, setNegotiationDraft] = useState({ party: "Buyer", action: "Counter", amount: "", notes: "" });
  const logNegotiation = (offerId) => {
    if (!negotiationDraft.amount) return;
    api.offers.addNegotiation(offerId, { ...negotiationDraft, createdBy: currentAgentId })
      .then((saved) => setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, negotiations: saved.negotiations } : o))))
      .catch((e) => alert("Couldn't log negotiation: " + e.message));
    setNegotiationDraft({ party: "Buyer", action: "Counter", amount: "", notes: "" });
  };

  const scopedOffers = useMemo(() => {
    if (currentRole !== "agent") return offers;
    return offers.filter((o) => o.agent === currentAgentId || o.listingAgent === currentAgentId);
  }, [offers, currentRole, currentAgentId]);

  const OFFER_STAGES = [
    { key: "new", label: "New" },
    { key: "negotiating", label: "Negotiating" },
    { key: "agreed", label: "Agreed" },
    { key: "no_deal", label: "No deal" },
  ];
  const offerStage = (o) => {
    if (o.agreed === "Yes") return "agreed";
    if (o.agreed === "No") return "no_deal";
    return (o.negotiations || []).length > 0 ? "negotiating" : "new";
  };
  const [draggedOfferId, setDraggedOfferId] = useState(null);
  const handleOfferDrop = (stageKey) => {
    const id = draggedOfferId;
    setDraggedOfferId(null);
    if (!id) return;
    const offer = offers.find((o) => o.id === id);
    if (!offer || offerStage(offer) === stageKey) return;
    if (stageKey === "agreed") setOfferAgreed(id, "Yes");
    else if (stageKey === "no_deal") setOfferAgreed(id, "No");
    else if (stageKey === "negotiating") openOfferDrawer(id);
    else if (stageKey === "new" && offer.agreed !== "Pending") setOfferAgreed(id, "Pending");
  };
  const offerBoardStats = useMemo(() => {
    const now = new Date();
    const q = MONTH_TO_Q[MONTH_ABBRS[now.getMonth()]];
    const thisQuarterOffers = scopedOffers.filter((o) => {
      const p = parseDealMonth(o.month);
      return p && Number(p.year) === now.getFullYear() && p.quarter === q;
    });
    const agreedCount = scopedOffers.filter((o) => o.agreed === "Yes").length;
    const decidedCount = scopedOffers.filter((o) => o.agreed !== "Pending").length;
    const byAgent = {};
    scopedOffers.forEach((o) => { byAgent[o.agent] = (byAgent[o.agent] || 0) + 1; });
    const topAgentId = Object.entries(byAgent).sort((a, b) => b[1] - a[1])[0];
    return {
      thisQuarter: thisQuarterOffers.length,
      conversionPct: decidedCount ? Math.round((agreedCount / decidedCount) * 100) : 0,
      topAgent: topAgentId ? agentName(topAgentId[0]) + " · " + topAgentId[1] : "—",
    };
  }, [scopedOffers]);

  const AGENT_EDITABLE_DEAL_FIELDS = ["otpStatus", "transferProgress", "conditionStatus", "expRegDate"];
  const ADMIN_AGENT_EDITABLE_DEAL_FIELDS = ["otpStatus"];
  const dealFieldLocked = (key) => {
    if ((currentRole === "agent" || currentRole === "officeAdmin") && currentAgentId === ADMIN_AGENT_ID) return !ADMIN_AGENT_EDITABLE_DEAL_FIELDS.includes(key);
    return currentRole === "agent" && !AGENT_EDITABLE_DEAL_FIELDS.includes(key);
  };

  const [dealDrawerId, setDealDrawerId] = useState(null);
  const [addingConditionForDeal, setAddingConditionForDeal] = useState(null);
  const [conditionDraft, setConditionDraft] = useState({ conditionType: CONDITION_TYPE_OPTIONS[0], description: "", responsibleParty: "", dueDate: "", mandatory: true });
  const openAddCondition = (dealId) => {
    setConditionDraft({ conditionType: CONDITION_TYPE_OPTIONS[0], description: "", responsibleParty: "", dueDate: "", mandatory: true });
    setAddingConditionForDeal(dealId);
  };
  const submitAddCondition = (dealId) => {
    api.deals.addDealCondition(dealId, { ...conditionDraft, createdBy: currentAgentId })
      .then((saved) => setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, conditionRows: saved.conditionRows } : d))))
      .catch((e) => alert("Couldn't add condition: " + e.message));
    setAddingConditionForDeal(null);
  };
  const updateDealConditionRow = (dealId, conditionId, patch) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId
      ? { ...d, conditionRows: d.conditionRows.map((c) => (c.id === conditionId ? { ...c, ...patch } : c)) }
      : d)));
    const row = {};
    if (patch.status !== undefined) { row.status = patch.status; row.dateFulfilled = patch.status === "Fulfilled" ? new Date().toISOString().slice(0, 10) : null; }
    if (patch.dueDate !== undefined) row.dueDate = patch.dueDate;
    if (patch.responsibleParty !== undefined) row.responsibleParty = patch.responsibleParty;
    api.deals.updateDealCondition(dealId, conditionId, row).catch((e) => console.error("Failed to save condition", e));
  };
  const removeDealConditionRow = (dealId, conditionId) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, conditionRows: d.conditionRows.filter((c) => c.id !== conditionId) } : d)));
    api.deals.deleteDealCondition(dealId, conditionId).catch((e) => console.error("Failed to remove condition", e));
  };
  const renderDealCardField = (d, c, calc) => {
    const fieldLocked = dealFieldLocked(c.key);
    return (
      <div className="deal-field" key={c.key}>
        <label>{c.label}</label>
        {c.type === "condition" && (
          <select
            className={"cell-input cond-select " + CONDITION_CLASS[CONDITION_GROUP[d.conditionStatus]]}
            value={d.conditionStatus}
            onChange={(e) => updateDeal(d.id, "conditionStatus", e.target.value)}
          >
            {CONDITION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {c.type === "select" && (
          <select className="cell-input" disabled={fieldLocked} value={d[c.key] || ""} onChange={(e) => updateDeal(d.id, c.key, e.target.value)}>
            {!c.options.includes(d[c.key]) && <option value="">— select —</option>}
            {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {c.type === "boolean" && (
          <label className="req-checkbox" style={{ marginTop: 4 }}>
            <input type="checkbox" disabled={fieldLocked} checked={!!d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.checked)} />
            {d[c.key] ? "Yes" : "No"}
          </label>
        )}
        {c.type === "split" && (
          d.sharedWithAgent ? (
            <select className="cell-input" disabled={fieldLocked} value={d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.value)}>
              <option value="">Choose split...</option>
              {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <span className="split-disabled" title="Select a Shared With agent first">— n/a —</span>
          )
        )}
        {c.type === "agent" && (
          <select className="cell-input" disabled={fieldLocked} value={d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.value)}>
            {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        {c.type === "agent-optional" && (
          <select
            className="cell-input"
            disabled={fieldLocked}
            value={d[c.key]}
            onChange={(e) => {
              updateDeal(d.id, c.key, e.target.value);
              if (!e.target.value) updateDeal(d.id, "sharedSplit", "");
            }}
          >
            <option value="">— none —</option>
            {agentsList.filter((a) => a.id !== d.agent).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        {c.type === "date" && (
          <input type="date" className="cell-input" disabled={fieldLocked} value={d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.value)} />
        )}
        {c.type === "money" && (
          <MoneyInput className="cell-input crm-mono" disabled={fieldLocked} value={d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.value)} />
        )}
        {c.type === "percent" && (
          <input type="number" step={0.5} className="cell-input crm-mono" disabled={fieldLocked} value={d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.value)} />
        )}
        {c.type === "text" && (
          <input type="text" className="cell-input" disabled={fieldLocked} value={d[c.key]} onChange={(e) => updateDeal(d.id, c.key, e.target.value)} />
        )}
        {c.type === "datalist" && (
          <>
            <input
              type="text"
              list={d.id + "-" + c.key}
              className="cell-input"
              placeholder="Search or type new..."
              disabled={fieldLocked}
              value={d[c.key]}
              onChange={(e) => updateDeal(d.id, c.key, e.target.value)}
            />
            <datalist id={d.id + "-" + c.key}>
              {c.options.map((o) => <option key={o} value={o} />)}
            </datalist>
          </>
        )}
        {c.type === "computed-total" && (
          <span className="crm-mono computed-cell" title="Auto-calculated: Agreed Offer x Com % ex VAT">
            {fmtPrice(Math.round((Number(d.agreedOffer) || 0) * (Number(d.comPercent) || 0) / 100))}
          </span>
        )}
        {c.type === "computed-listing" && (
          <span className="crm-mono computed-cell">{fmtPrice(Math.round(calc.listingFee))}</span>
        )}
        {c.type === "computed-commission" && (
          <span className="crm-mono computed-cell">
            {fmtPrice(Math.round(calc.sellingSplits.find((s) => s.agentId === d.agent) ? calc.sellingSplits.find((s) => s.agentId === d.agent).amount : 0))}
            {calc.sellingSplits.length > 1 && <div className="lead-sub">split {d.sharedSplit}</div>}
          </span>
        )}
        {c.type === "computed-nett" && (
          <span className="crm-mono computed-cell" title={"Based on " + d.dealStatus + " tier (" + Math.round(COMMISSION_FORMULA[d.dealStatus]?.agentSharePct * 100 || 0) + "% to agent)"}>
            {fmtPrice(Math.round(calc.nettToKingstons))}
            <div className="lead-sub">{d.dealStatus} tier</div>
          </span>
        )}
      </div>
    );
  };

  const renderDealsTable = (dealsList, emptyMessage) => {
    if (dealsList.length === 0) {
      return (
        <div className="panel">
          <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>{emptyMessage}</div>
        </div>
      );
    }
    return (
      <div className="panel simple-deal-list">
        {dealsList.map((d) => {
          const calc = computeDealCommission(d);
          const stepsDone = (d.transferSteps || []).filter((s) => s.done).length;
          const statusGroup = CONDITION_GROUP[d.conditionStatus] || "Suspensive";
          return (
            <div className="simple-deal-row" key={d.id}>
              <div className="simple-deal-main">
                <div className="lead-name">{d.property || "Untitled deal"}</div>
                <div className="lead-sub">{d.suburb || "Residential"} · {d.month || "No month"} · {agentName(d.agent)}</div>
              </div>
              <div>
                <select
                  className={"cell-input cond-select " + CONDITION_CLASS[statusGroup]}
                  value={d.conditionStatus || "Suspensive Bond"}
                  onChange={(e) => updateDeal(d.id, "conditionStatus", e.target.value)}
                >
                  {CONDITION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="lead-sub">Status</div>
              </div>
              <div>
                <select
                  className={"cell-input deal-status-select " + DEAL_STATUS_CLASS[d.dealStatus]}
                  disabled={dealFieldLocked("dealStatus")}
                  value={d.dealStatus || agentTier(d.agent)}
                  onChange={(e) => updateDeal(d.id, "dealStatus", e.target.value)}
                >
                  {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="lead-sub">Tier</div>
              </div>
              <div className="simple-deal-money">
                <div className="crm-mono">{fmtPrice(d.askingPrice || d.agreedOffer || 0)}</div>
                <div className="lead-sub">Property price</div>
              </div>
              <div className="simple-deal-money">
                <div className="crm-mono">{fmtPrice(Math.round(d.confirmedCommission || 0))}</div>
                <div className="lead-sub">Total comm</div>
              </div>
              <div className="simple-deal-money">
                <div className="crm-mono">{fmtPrice(Math.round(calc.nettToKingstons || 0))}</div>
                <div className="lead-sub">Company comm</div>
              </div>
              <div className="simple-deal-detail">
                <div>{d.att || "No attorney"}</div>
                <div className="lead-sub">{d.bondThrough || "No bond originator"}</div>
              </div>
              <div className="simple-deal-actions">
                <button className="stage-btn" onClick={() => setDealDrawerId(d.id)}>Details</button>
                <button className="stage-btn" onClick={() => openTransferDrawer(d.id)}>
                  Transfer {stepsDone}/{TRANSFER_STEPS.length}
                </button>
                <button className="stage-btn" onClick={() => openOtpDrawer(d.id)}>OTP</button>
                {isDealRegistered(d) ? (
                  <span className="badge cond-confirmed">Registered</span>
                ) : (
                  <button className="stage-btn active" onClick={() => openRegisterConfirm(d.id)}>Registered</button>
                )}
                <button className="row-remove" onClick={() => removeDeal(d.id)}><X size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  const offerDrawer = useMemo(() => offers.find((o) => o.id === offerDrawerId) || null, [offers, offerDrawerId]);
  const dealDrawer = useMemo(() => deals.find((d) => d.id === dealDrawerId) || null, [deals, dealDrawerId]);
  const rentalOfferDrawer = useMemo(() => rentalOffers.find((o) => o.id === rentalOfferDrawerId) || null, [rentalOffers, rentalOfferDrawerId]);
  const rentalDealDrawer = useMemo(() => rentalDeals.find((d) => d.id === rentalDealDrawerId) || null, [rentalDeals, rentalDealDrawerId]);
  const openOfferDrawer = (id) => {
    setOfferDrawerId(id);
    setOfferNoteDraft("");
    setOfferFollowUpDraft({ reason: OFFER_FOLLOWUP_OPTIONS[0], date: "", note: "" });
    setOfferMeetingDraft({ date: "", notes: "" });
  };

  const dealYears = useMemo(() => {
    const years = new Set(deals.map((d) => parseDealMonth(d.month)?.year).filter(Boolean));
    return years.size ? [...years].sort() : [String(new Date().getFullYear())];
  }, [deals]);

  const [selectedYear, setSelectedYear] = useState(dealYears[dealYears.length - 1]);
  const [importSummary, setImportSummary] = useState(null);
  const [viewingAgentId, setViewingAgentId] = useState(null);
  const [transferDealId, setTransferDealId] = useState(null);
  const [columnOrder, setColumnOrder] = useState(DEFAULT_COLUMN_ORDER);
  const [roleHiddenColumns, setRoleHiddenColumns] = useState({ officeManager: [], agent: [] });
  const [agentTargets, setAgentTargets] = useState({});
  const [rentalAgentTargets, setRentalAgentTargets] = useState({});
  const [attorneyEmails, setAttorneyEmails] = useState(
    Object.fromEntries(ATTORNEY_OPTIONS.map((name) => [name, ""]))
  );
  const [attorneyPhones, setAttorneyPhones] = useState(
    Object.fromEntries(ATTORNEY_OPTIONS.map((name) => [name, ""]))
  );
  const [attorneyContacts, setAttorneyContacts] = useState(
    Object.fromEntries(ATTORNEY_OPTIONS.map((name) => [name, ""]))
  );
  const [agentContacts, setAgentContacts] = useState(
    Object.fromEntries(agentsList.map((a) => [a.id, { cell: "", email: "" }]))
  );
  const [pendingUsers, setPendingUsers] = useState([]);
  const [linkedProfiles, setLinkedProfiles] = useState([]);
  const [previewRole, setPreviewRole] = useState("agent");

  const allContacts = useMemo(() => {
    const rows = [];

    // Landlords / Property Owners — every canvassing record, including the
    // ones where no information could be obtained (kept on file as asked).
    doorKnocks.forEach((dk) => {
      rows.push({
        id: "contact-dk-" + dk.id,
        category: "Landlord/Property Owner",
        name: dk.ownerName || dk.knownName || "Unknown owner",
        phone: dk.ownerPhone || "",
        email: dk.emailContactDetails || "",
        address: dk.address + (dk.suburb ? ", " + dk.suburb : ""),
        agent: dk.broker || dk.agent,
        noInfo: !!dk.noInfoObtained,
        source: "Canvassing",
      });
    });

    // Buyers — from deals and offers, deduplicated by name+email.
    const buyerSeen = new Set();
    const addBuyer = (name, email, address, agentId) => {
      if (!name) return;
      const dedupeKey = name.toLowerCase() + "|" + (email || "");
      if (buyerSeen.has(dedupeKey)) return;
      buyerSeen.add(dedupeKey);
      rows.push({ id: "contact-buyer-" + dedupeKey, category: "Buyer", name, phone: "", email: email || "", address: address || "", agent: agentId, noInfo: false, source: "Deals/Offers" });
    };
    deals.forEach((d) => addBuyer(d.buyerName, d.buyerEmail, d.property, d.agent));
    offers.forEach((o) => addBuyer(o.buyerName, "", o.property, o.agent));

    // Attorneys — from the firm directory.
    ATTORNEY_OPTIONS.forEach((name) => {
      const email = attorneyEmails[name] || "";
      const phone = attorneyPhones[name] || "";
      const contactName = attorneyContacts[name] || "";
      if (!email && !phone && !contactName) return;
      rows.push({ id: "contact-att-" + name, category: "Attorney", name: contactName ? contactName + " (" + name + ")" : name, phone, email, address: "", agent: null, noInfo: false, source: "Attorney directory" });
    });

    // Leads — every buyer prospect already in the pipeline.
    leads.forEach((l) => {
      rows.push({ id: "contact-lead-" + l.id, category: "Lead", name: l.name, phone: l.phone || "", email: l.email || "", address: l.listingAddress || "", agent: l.agent, noInfo: false, source: "Leads" });
    });

    // Manually added (Tenants, or anything not otherwise captured).
    manualContacts.forEach((c) => rows.push({ ...c, source: "Manually added" }));

    return rows;
  }, [doorKnocks, deals, offers, leads, manualContacts, attorneyEmails, attorneyPhones, attorneyContacts]);

  const addManualContact = () => {
    if (!contactFormDraft.name.trim()) return;
    const draft = { ...contactFormDraft, name: contactFormDraft.name.trim() };
    api.contacts.addContact(draft)
      .then((saved) => setManualContacts((prev) => [...prev, { ...saved, agent: currentAgentId, noInfo: false }]))
      .catch((e) => alert("Couldn't save contact: " + e.message));
    setContactFormDraft({ name: "", category: "Tenant", phone: "", email: "", address: "", notes: "" });
    setAddContactOpen(false);
  };

  // Used by ContactPicker when creating a new Purchaser/Seller — checks
  // for an existing contact with the same email or cell number first (the
  // dedupe the user asked for), so a slightly different name spelling
  // doesn't spawn a second record for someone already on file.
  const createAndLinkContact = async ({ name, phone, email, category }) => {
    const trimmedEmail = (email || "").trim().toLowerCase();
    const normalizedPhone = (phone || "").replace(/\D/g, "");
    const dup = manualContacts.find((c) => {
      const emailMatch = trimmedEmail && (c.email || "").trim().toLowerCase() === trimmedEmail;
      const phoneMatch = normalizedPhone.length >= 7 && (c.phone || "").replace(/\D/g, "") === normalizedPhone;
      return emailMatch || phoneMatch;
    });
    if (dup) return { contact: dup, wasDuplicate: true };
    const saved = await api.contacts.addContact({ name: name.trim(), phone, email, category, address: "", notes: "" });
    setManualContacts((prev) => [...prev, saved]);
    return { contact: saved, wasDuplicate: false };
  };

  const [contactDetailId, setContactDetailId] = useState(null);
  const openContactDetail = (id) => setContactDetailId(id);
  const contactDetail = useMemo(() => manualContacts.find((c) => c.id === contactDetailId) || null, [manualContacts, contactDetailId]);
  const contactHistory = useMemo(() => {
    if (!contactDetailId) return [];
    const rows = [];
    offers.forEach((o) => {
      const status = o.dealId ? "Converted to deal" : (o.agreed === "Yes" ? "Agreed" : o.agreed === "No" ? "No deal" : "Pending");
      const agentLabel = agentName(o.agent);
      if (o.buyerContactId === contactDetailId) rows.push({ id: "o-" + o.id, kind: "offer", role: "Purchaser", date: o.date, agentLabel, property: o.property, status, openOffer: o.id });
      if (o.sellerContactId === contactDetailId) rows.push({ id: "o-" + o.id + "-s", kind: "offer", role: "Seller", date: o.date, agentLabel, property: o.property, status, openOffer: o.id });
    });
    deals.forEach((d) => {
      const status = isDealRegistered(d) ? "Registered" : d.conditionStatus;
      const agentLabel = agentName(d.agent);
      if (d.buyerContactId === contactDetailId) rows.push({ id: "d-" + d.id, kind: "deal", role: "Purchaser", date: d.date, agentLabel, property: d.property, status, openDeal: d.id });
      if (d.sellerContactId === contactDetailId) rows.push({ id: "d-" + d.id + "-s", kind: "deal", role: "Seller", date: d.date, agentLabel, property: d.property, status, openDeal: d.id });
    });
    rentalOffers.forEach((o) => {
      const status = o.dealId ? "Converted to deal" : (o.status === "Yes" ? "Accepted" : o.status === "No" ? "No deal" : "Pending");
      const agentLabel = rentalAgentsList.find((a) => a.id === o.agent)?.name || "Unassigned";
      if (o.landlordContactId === contactDetailId) rows.push({ id: "ro-" + o.id, kind: "rental offer", role: "Landlord", date: o.date, agentLabel, property: o.property, status, openRentalOffer: o.id });
      if (o.tenantContactId === contactDetailId) rows.push({ id: "ro-" + o.id + "-t", kind: "rental offer", role: "Tenant", date: o.date, agentLabel, property: o.property, status, openRentalOffer: o.id });
    });
    rentalDeals.forEach((d) => {
      const agentLabel = rentalAgentsList.find((a) => a.id === d.agent)?.name || "Unassigned";
      if (d.landlordContactId === contactDetailId) rows.push({ id: "rd-" + d.id, kind: "rental deal", role: "Landlord", date: d.date, agentLabel, property: d.property, status: d.status, openRentalDeal: d.id });
      if (d.tenantContactId === contactDetailId) rows.push({ id: "rd-" + d.id + "-t", kind: "rental deal", role: "Tenant", date: d.date, agentLabel, property: d.property, status: d.status, openRentalDeal: d.id });
    });
    return rows.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }, [contactDetailId, offers, deals, rentalOffers, rentalDeals, rentalAgentsList]);

  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [draggedColKey, setDraggedColKey] = useState(null);

  const transferDeal = useMemo(() => deals.find((d) => d.id === transferDealId) || null, [deals, transferDealId]);
  const openTransferDrawer = (dealId) => setTransferDealId(dealId);

  const toggleTransferStep = (dealId, stepIndex) => {
    let doneValue = false, dateValue = "";
    setDeals((prev) => prev.map((d) => {
      if (d.id !== dealId) return d;
      const steps = d.transferSteps.map((s, i) => {
        if (i !== stepIndex) return s;
        const done = !s.done;
        doneValue = done;
        dateValue = done ? new Date().toISOString().slice(0, 10) : "";
        return { ...s, done, dateCompleted: dateValue };
      });
      return { ...d, transferSteps: steps };
    }));
    api.deals.setTransferStep(dealId, stepIndex, { done: doneValue, dateCompleted: dateValue })
      .catch((e) => console.error("Failed to save transfer step", e));
  };

  const setTransferStepDate = (dealId, stepIndex, dateStr) => {
    setDeals((prev) => prev.map((d) => {
      if (d.id !== dealId) return d;
      const steps = d.transferSteps.map((s, i) => (i === stepIndex ? { ...s, dateCompleted: dateStr } : s));
      return { ...d, transferSteps: steps };
    }));
    const stepDone = transferDeal?.transferSteps?.[stepIndex]?.done || false;
    api.deals.setTransferStep(dealId, stepIndex, { done: stepDone, dateCompleted: dateStr })
      .catch((e) => console.error("Failed to save transfer step date", e));
  };

  const addDealActivity = (dealId, text) => {
    const entry = { id: uid("dact"), text, timestamp: new Date(), author: currentAgentId };
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, activity: [...(d.activity || []), entry] } : d)));
    api.deals.addActivity(dealId, text).catch((e) => console.error("Failed to save deal activity", e));
  };

  const [registeringDealId, setRegisteringDealId] = useState(null);
  const [registeredDateDraft, setRegisteredDateDraft] = useState("");

  const openRegisterConfirm = (dealId) => {
    setRegisteringDealId(dealId);
    setRegisteredDateDraft(new Date().toISOString().slice(0, 10));
  };

  const confirmDealRegistered = () => {
    if (!registeringDealId || !registeredDateDraft) return;
    setDeals((prev) => prev.map((d) => {
      if (d.id !== registeringDealId) return d;
      const steps = d.transferSteps.map((s, i) => (i === 16 ? { ...s, done: true, dateCompleted: registeredDateDraft } : s));
      return { ...d, transferSteps: steps };
    }));
    api.deals.setTransferStep(registeringDealId, 16, { done: true, dateCompleted: registeredDateDraft })
      .catch((e) => console.error("Failed to save registration", e));
    api.deals.updateDeal(registeringDealId, { registered: true, registered_date: registeredDateDraft })
      .catch((e) => console.error("Failed to save registration", e));
    addDealActivity(registeringDealId, "Registered on " + fmtDate(new Date(registeredDateDraft)));
    setRegisteringDealId(null);
    setRegisteredDateDraft("");
  };

  const otpDeal = useMemo(() => deals.find((d) => d.id === otpDealId) || null, [deals, otpDealId]);
  const openOtpDrawer = (dealId) => setOtpDealId(dealId);

  const otpTodoForDeal = (deal) => (deal && deal.otpTodoId ? todos.find((t) => t.id === deal.otpTodoId) : null);

  const createOtpTask = async (deal) => {
    const todo = await api.todos.addTodo({
      agentId: ADMIN_AGENT_ID, dealId: deal.id,
      kind: "otp-send",
      label: "Send Offer to Purchase to buyer, seller, and attorney for " + (deal.property || "this deal"),
    }).catch((e) => { console.error("Failed to create OTP task", e); return null; });
    if (!todo) return;
    setTodos((prev) => [...prev, todo]);
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, otpTodoId: todo.id } : d)));
    api.deals.updateDeal(deal.id, { otp_todo_id: todo.id }).catch((e) => console.error("Failed to link OTP task", e));
    pushTodoToMsToDo(todo.id);
  };

  const updateDealOtp = (dealId, field, value) => {
    let justCompleted = false;
    let linkedTodoId = null;
    setDeals((prev) => prev.map((d) => {
      if (d.id !== dealId) return d;
      const next = { ...d, [field]: value };
      if (next.otpSentBuyer && next.otpSentSeller && next.otpSentAttorney) {
        justCompleted = true;
        linkedTodoId = next.otpTodoId;
      }
      return next;
    }));
    const column = { otpSentBuyer: "otp_sent_buyer", otpSentSeller: "otp_sent_seller", otpSentAttorney: "otp_sent_attorney" }[field];
    if (column) api.deals.updateDeal(dealId, { [column]: value }).catch((e) => console.error("Failed to save OTP status", e));
    if (justCompleted && linkedTodoId) toggleTodo(linkedTodoId);
  };

  const handleOtpFileUpload = (dealId, file) => {
    if (!file) return;
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, otpFileName: file.name } : d)));
    api.deals.uploadDealFile(dealId, "otp", file)
      .then((saved) => setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, otpFilePath: saved.otpFilePath } : d))))
      .catch((e) => alert("Couldn't upload OTP file: " + e.message));
  };

  const handleCommStatementUpload = (dealId, file) => {
    if (!file) return;
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, commStatementFileName: file.name } : d)));
    api.deals.uploadDealFile(dealId, "comm-statement", file)
      .then((saved) => setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, commStatementFilePath: saved.commStatementFilePath } : d))))
      .catch((e) => alert("Couldn't upload commission statement: " + e.message));
  };

  const OTP_EMAIL_SUBJECT = (property) => "Offer to Purchase — " + (property || "");
  const OTP_EMAIL_BODY_PLACEHOLDER = "[Template pending — replace this with the wording you provide. This placeholder is a stand-in so the send flow already works end-to-end.]";

  const buildSellerEmailBody = (deal) => {
    const agent = agentName(deal.agent);
    const contact = agentContacts[deal.agent] || { cell: "", email: "" };
    const attorneyPhone = attorneyPhones[deal.att] || "";
    const sellerFirst = (deal.sellerName || "").trim() || "there";
    const address = deal.property + (deal.suburb ? ", " + deal.suburb : "");
    return (
      "Good day " + sellerFirst + "\n\n" +
      "On behalf of my colleague, " + agent + " please find the attached signed Offer to Purchase for " + address + "\n\n" +
      "We would like to take this opportunity to congratulate you on receiving the offer. We will keep you informed moving forward with the progress of the offer.\n\n" +
      "The attorneys " + (deal.att || "[attorney]") + (attorneyPhone ? " (" + attorneyPhone + ")" : "") + " will also keep you informed with the process moving forward.\n\n" +
      "Please don't hesitate to contact " + agent + " should you need anything on the following contact details:\n" +
      "Cell: " + (contact.cell || "(Agent's cell number)") + "\n" +
      "Email: " + (contact.email || "(Agent's email address)") + "\n\n" +
      "Kind Regards"
    );
  };

  const buildBuyerEmailBody = (deal) => {
    const agent = agentName(deal.agent);
    const contact = agentContacts[deal.agent] || { cell: "", email: "" };
    const attorneyPhone = attorneyPhones[deal.att] || "";
    const buyerFirst = (deal.buyerName || "").trim() || "there";
    const address = deal.property + (deal.suburb ? ", " + deal.suburb : "");
    return (
      "Good day " + buyerFirst + "\n\n" +
      "On behalf of my colleagues, " + agent + " please find the attached signed offer to purchase for " + address + "\n\n" +
      "We would like to take this opportunity to congratulate you on your offer being accepted. The nominated transfer attorneys are " +
      (deal.att || "[attorney]") + (attorneyPhone ? " (" + attorneyPhone + ")" : "") + ". They will be in touch with you with the next steps.\n\n" +
      "* Please don't hesitate to contact " + agent + " should you need anything on the following contact details:\n" +
      "* Cell: " + (contact.cell || "(Agent's cell number)") + "\n" +
      "* Email: " + (contact.email || "(Agent's email address)") + "\n" +
      "Kind Regards"
    );
  };

  const buildAttorneyEmailBody = (deal) => {
    const contactName = (attorneyContacts[deal.att] || "").trim() || deal.att || "there";
    const address = deal.property + (deal.suburb ? ", " + deal.suburb : "");
    const reference = (deal.property || "").toUpperCase();
    const isCash = !deal.bondThrough || deal.bondThrough === "NA";
    const financeLine = isCash
      ? "This is a cash offer."
      : "Please take note that the offer has suspensive conditions, please make note of these conditions set out in the OTP.";
    return (
      "Good day " + contactName + "\n\n" +
      "I would like to inform you that you have been nominated for the transfer for " + address + "\n\n" +
      "Please find the attached OTP and commission statement.\n\n" +
      financeLine + "\n" +
      "Please note once registration takes place, when you make the payment to our account please use the following reference:\n" +
      reference + "\n\n" +
      "If there is anything you require, please feel free to contact us.\n\n" +
      "Kind Regard"
    );
  };

  const buildOtpEmailBody = (deal, who) => {
    if (who === "seller") return buildSellerEmailBody(deal);
    if (who === "buyer") return buildBuyerEmailBody(deal);
    if (who === "attorney") return buildAttorneyEmailBody(deal);
    return OTP_EMAIL_BODY_PLACEHOLDER;
  };

  const sendOtpEmail = (deal, who, address) => {
    if (!address) return;
    const mailto = "mailto:" + encodeURIComponent(address) +
      "?subject=" + encodeURIComponent(OTP_EMAIL_SUBJECT(deal.property)) +
      "&body=" + encodeURIComponent(buildOtpEmailBody(deal, who));
    window.open(mailto, "_blank");
    const field = who === "buyer" ? "otpSentBuyer" : who === "seller" ? "otpSentSeller" : "otpSentAttorney";
    updateDealOtp(deal.id, field, true);
  };

  const setAttorneyEmail = (name, email) => {
    setAttorneyEmails((prev) => ({ ...prev, [name]: email }));
    api.attorneys.upsertAttorney({ name, contactName: attorneyContacts[name], email, phone: attorneyPhones[name] })
      .catch((e) => console.error("Failed to save attorney email", e));
  };
  const setAttorneyContactName = (name, contactName) => {
    setAttorneyContacts((prev) => ({ ...prev, [name]: contactName }));
    api.attorneys.upsertAttorney({ name, contactName, email: attorneyEmails[name], phone: attorneyPhones[name] })
      .catch((e) => console.error("Failed to save attorney contact", e));
  };
  const setAttorneyPhoneNumber = (name, phone) => {
    setAttorneyPhones((prev) => ({ ...prev, [name]: phone }));
    api.attorneys.upsertAttorney({ name, contactName: attorneyContacts[name], email: attorneyEmails[name], phone })
      .catch((e) => console.error("Failed to save attorney phone", e));
  };
  const setAgentContactField = (agentId, field, value) => {
    setAgentContacts((prev) => ({ ...prev, [agentId]: { ...(prev[agentId] || {}), [field]: value } }));
    const next = { cell: agentContacts[agentId]?.cell || "", email: agentContacts[agentId]?.email || "", [field]: value };
    api.agents.updateAgentContact(agentId, next).catch((e) => console.error("Failed to save agent contact", e));
  };

  const openAgentProfile = (agentId) => {
    setViewingAgentId(agentId);
    setNav("agentprofile");
  };

  const periodDeals = useMemo(() => {
    return deals.filter((d) => {
      const p = parseDealMonth(d.month);
      if (!p || p.year !== selectedYear) return false;
      if (periodMode === "year") return true;
      if (periodMode === "month") return p.mon === selectedMonth;
      return p.quarter === selectedQuarter;
    });
  }, [deals, selectedYear, periodMode, selectedQuarter, selectedMonth]);

  const agentCommissionTotals = useMemo(() => aggregateAgentCommission(periodDeals), [periodDeals]);

  const conditionTotals = useMemo(() => {
    const byAgent = {};
    let teamConfirmed = 0, teamSuspensive = 0, teamFallenThrough = 0;
    periodDeals.forEach((d) => {
      const amt = Number(d.confirmedCommission) || 0;
      const group = CONDITION_GROUP[d.conditionStatus] || "Confirmed";
      const shares = splitGrossAmount(d, amt);
      shares.forEach(({ agentId, amount }) => {
        if (!byAgent[agentId]) byAgent[agentId] = { confirmed: 0, suspensive: 0, fallenThrough: 0 };
        if (group === "Confirmed") byAgent[agentId].confirmed += amount;
        else if (group === "FallenThrough") byAgent[agentId].fallenThrough += amount;
        else byAgent[agentId].suspensive += amount;
      });
      if (group === "Confirmed") teamConfirmed += amt;
      else if (group === "FallenThrough") teamFallenThrough += amt;
      else teamSuspensive += amt;
    });
    return { byAgent, teamConfirmed, teamSuspensive, teamFallenThrough };
  }, [periodDeals]);

  const getYearlyTarget = (agentId, year) => agentTargets[year]?.[agentId] || 0;

  const setYearlyTarget = (agentId, year, amount) => {
    setAgentTargets((prev) => ({ ...prev, [year]: { ...(prev[year] || {}), [agentId]: Number(amount) || 0 } }));
    api.targets.setTarget(agentId, year, Number(amount) || 0).catch((e) => console.error("Failed to save target", e));
  };

  const CURRENT_REAL_DATE = new Date("2026-07-08T00:00:00");

  const buildTargetProgress = (agentId, year) => {
    const yearly = getYearlyTarget(agentId, year);
    const monthly = yearly / 12;
    const quarterly = yearly / 4;
    const { byMonth, total } = computeAgentActuals(deals, agentId, year);

    const isCurrentYear = String(CURRENT_REAL_DATE.getFullYear()) === year;
    const monthsElapsed = isCurrentYear ? CURRENT_REAL_DATE.getMonth() + 1 : 12;
    const monthsRemaining = Math.max(12 - monthsElapsed, 0);

    const expectedToDate = monthly * monthsElapsed;
    const paceDelta = total - expectedToDate;
    const remaining = Math.max(yearly - total, 0);
    const avgNeededPerRemainingMonth = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

    const quarterActual = (q) => [1, 2, 3].map((i) => MONTH_ABBRS[(q - 1) * 3 + i - 1]).reduce((s, m) => s + (byMonth[m] || 0), 0);
    const byQuarter = { 1: quarterActual(1), 2: quarterActual(2), 3: quarterActual(3), 4: quarterActual(4) };

    return { yearly, monthly, quarterly, byMonth, byQuarter, total, monthsElapsed, monthsRemaining, expectedToDate, paceDelta, remaining, avgNeededPerRemainingMonth };
  };

  const getRentalYearlyTarget = (agentId, year) => rentalAgentTargets[year]?.[agentId]?.managedDeals || 0;
  const setRentalYearlyTarget = (agentId, year, count) => {
    setRentalAgentTargets((prev) => ({
      ...prev,
      [year]: { ...(prev[year] || {}), [agentId]: { ...(prev[year]?.[agentId] || {}), managedDeals: Number(count) || 0 } },
    }));
    api.rentalTargets.setRentalTarget(agentId, year, Number(count) || 0).catch((e) => console.error("Failed to save rental target", e));
  };

  const getRentalYearlyCommissionTarget = (agentId, year) => rentalAgentTargets[year]?.[agentId]?.commission || 0;
  const setRentalYearlyCommissionTarget = (agentId, year, amount) => {
    setRentalAgentTargets((prev) => ({
      ...prev,
      [year]: { ...(prev[year] || {}), [agentId]: { ...(prev[year]?.[agentId] || {}), commission: Number(amount) || 0 } },
    }));
    api.rentalTargets.setRentalCommissionTarget(agentId, year, Number(amount) || 0).catch((e) => console.error("Failed to save rental commission target", e));
  };

  // Same shape as buildTargetProgress, but counting completed managed
  // deals instead of summing Rand — "yearly"/"quarterly"/"monthly" are
  // deal counts here, not commission.
  const buildRentalTargetProgress = (agentId, year) => {
    const yearly = getRentalYearlyTarget(agentId, year);
    const monthly = yearly / 12;
    const quarterly = yearly / 4;
    const { byMonth, total } = computeRentalAgentActuals(rentalDeals, agentId, year);

    const isCurrentYear = String(CURRENT_REAL_DATE.getFullYear()) === year;
    const monthsElapsed = isCurrentYear ? CURRENT_REAL_DATE.getMonth() + 1 : 12;
    const remaining = Math.max(yearly - total, 0);

    const quarterActual = (q) => [1, 2, 3].map((i) => MONTH_ABBRS[(q - 1) * 3 + i - 1]).reduce((s, m) => s + (byMonth[m] || 0), 0);
    const byQuarter = { 1: quarterActual(1), 2: quarterActual(2), 3: quarterActual(3), 4: quarterActual(4) };
    const currentQuarter = Math.ceil(monthsElapsed / 3);
    const quarterRemaining = Math.max(Math.ceil(quarterly) - (byQuarter[currentQuarter] || 0), 0);

    return { yearly, monthly, quarterly, byMonth, byQuarter, total, remaining, currentQuarter, quarterRemaining };
  };

  // Gross Commission (Finder's Fee) target progress — same shape as the
  // Sales buildTargetProgress, Rand-denominated, tracked against Completed
  // rental deals only (computeRentalAgentCommissionActuals).
  const buildRentalCommissionTargetProgress = (agentId, year) => {
    const yearly = getRentalYearlyCommissionTarget(agentId, year);
    const monthly = yearly / 12;
    const quarterly = yearly / 4;
    const { byMonth, total } = computeRentalAgentCommissionActuals(rentalDeals, agentId, year);

    const isCurrentYear = String(CURRENT_REAL_DATE.getFullYear()) === year;
    const monthsElapsed = isCurrentYear ? CURRENT_REAL_DATE.getMonth() + 1 : 12;
    const monthsRemaining = Math.max(12 - monthsElapsed, 0);

    const expectedToDate = monthly * monthsElapsed;
    const paceDelta = total - expectedToDate;
    const remaining = Math.max(yearly - total, 0);
    const avgNeededPerRemainingMonth = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

    const quarterActual = (q) => [1, 2, 3].map((i) => MONTH_ABBRS[(q - 1) * 3 + i - 1]).reduce((s, m) => s + (byMonth[m] || 0), 0);
    const byQuarter = { 1: quarterActual(1), 2: quarterActual(2), 3: quarterActual(3), 4: quarterActual(4) };

    return { yearly, monthly, quarterly, byMonth, byQuarter, total, monthsElapsed, monthsRemaining, expectedToDate, paceDelta, remaining, avgNeededPerRemainingMonth };
  };

  const PIPELINE_PIE_CATEGORIES = [
    { key: "aboveLine", label: "Above the Line", match: (s) => s === "Above the line", color: "var(--sage)" },
    { key: "bondOnly", label: "Suspensive Bonds", match: (s) => s === "Suspensive Bond", color: "var(--brass)" },
    { key: "awaitingCash", label: "Awaiting Cash", match: (s) => s === "Full Cash awaiting Cash" || s === "Suspensive of Sale only Cash from Proceeds", color: "var(--blue-ink)" },
    { key: "saleAndBond", label: "Suspensive Bond and Subject to Sale", match: (s) => s === "Suspensive of Bond and Sale", color: "#8B5FA8" },
  ];

  const pipelineCategoryData = useMemo(() => {
    return PIPELINE_PIE_CATEGORIES.map((cat) => {
      const matching = periodDeals.filter((d) => cat.match(d.conditionStatus));
      const value = matching.reduce((s, d) => s + (Number(d.confirmedCommission) || 0), 0);
      return { name: cat.label, key: cat.key, color: cat.color, count: matching.length, value };
    });
  }, [periodDeals]);

  const teamTargetForPeriod = useMemo(() => {
    return agentsList.reduce((sum, a) => {
      const progress = buildTargetProgress(a.id, selectedYear);
      const periodTarget = periodMode === "year" ? progress.yearly : periodMode === "quarter" ? progress.quarterly : progress.monthly;
      return sum + periodTarget;
    }, 0);
  }, [agentTargets, selectedYear, periodMode, deals]);

  const nettToKingstonsByTier = useMemo(() => {
    const byTier = { Yellow: 0, Blue: 0, Silver: 0, Gold: 0 };
    let total = 0;
    periodDeals.forEach((d) => {
      if (CONDITION_GROUP[d.conditionStatus] === "FallenThrough") return;
      const nett = computeDealCommission(d).nettToKingstons;
      byTier[d.dealStatus] = (byTier[d.dealStatus] || 0) + nett;
      total += nett;
    });
    return { byTier, total };
  }, [periodDeals]);

  const leaderboard = useMemo(() => {
    // Inactive agents stay visible to masterAdmin/officeManager (full
    // history preserved) but are hidden from other agents' leaderboard.
    // Non-brokers (e.g. a Director) never show here regardless of role.
    const visibleAgents = (currentRole === "agent" ? agentsList.filter((a) => a.active !== false) : agentsList)
      .filter((a) => !a.excludeFromLeaderboard);
    return visibleAgents
      .map((a) => ({
        agent: a,
        gross: conditionTotals.byAgent[a.id]?.confirmed || 0,
        suspensive: conditionTotals.byAgent[a.id]?.suspensive || 0,
        deals: periodDeals.filter((d) => d.agent === a.id).length,
      }))
      // Ranked by confirmed ("above the line") commission first; when two
      // agents are tied on that, whoever has more still in suspensive
      // ranks higher — same total confirmed, but more still coming.
      .sort((a, b) => b.gross - a.gross || b.suspensive - a.suspensive);
  }, [periodDeals, conditionTotals, agentsList, currentRole]);

  const DONUT_PALETTE = ["var(--brass)", "var(--ink)", "var(--sage)", "var(--clay)", "var(--blue-ink)", "#8B5FA8", "#E0935A"];

  const brokerShareData = useMemo(() => {
    const ranked = leaderboard.filter((r) => r.gross > 0);
    const top = ranked.slice(0, 5);
    const rest = ranked.slice(5);
    const items = top.map((r, i) => ({
      name: r.agent.name, value: r.gross, count: r.deals, countLabel: "completed", color: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }));
    if (rest.length > 0) {
      items.push({
        name: "Other", value: rest.reduce((s, r) => s + r.gross, 0), count: null, countLabel: "Combined",
        color: DONUT_PALETTE[top.length % DONUT_PALETTE.length],
      });
    }
    return items;
  }, [leaderboard]);

  const generatedInData = useMemo(() => {
    const colors = ["var(--brass)", "var(--ink)", "var(--sage)", "var(--clay)"];
    const names = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
    return [1, 2, 3, 4]
      .map((q, i) => {
        const matching = deals.filter((d) => {
          const p = parseDealMonth(d.month);
          return p && p.year === selectedYear && p.quarter === q && CONDITION_GROUP[d.conditionStatus] !== "FallenThrough";
        });
        const value = matching.reduce((s, d) => s + (Number(d.confirmedCommission) || 0), 0);
        return { name: names[i], value, count: matching.length, countLabel: "deals", color: colors[i] };
      })
      .filter((q) => q.value > 0 || q.count > 0);
  }, [deals, selectedYear]);

  const dealStatusDonutData = useMemo(
    () => pipelineCategoryData.map((c) => ({ ...c, countLabel: "deals" })),
    [pipelineCategoryData]
  );

  const renderDonutCard = (title, dataList) => {
    const total = dataList.reduce((s, d) => s + d.value, 0);
    return (
      <div className="donut-card">
        <div className="donut-card-head">
          <h3>{title}</h3>
          <div className={"donut-card-total crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")}>{fmtPrice(Math.round(total))}</div>
        </div>
        {dataList.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing here yet.</div>
        ) : (
          <div className="donut-card-body">
            <div className="donut-chart-wrap">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dataList} dataKey="value" nameKey="name" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
                    {dataList.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtPrice(Math.round(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">NET</div>
            </div>
            <div className="donut-legend">
              {dataList.map((d, i) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div className="donut-legend-item" key={i}>
                    <span className="donut-swatch" style={{ background: d.color }} />
                    <div>
                      <div className="donut-legend-name">{d.name}</div>
                      <div className={"donut-legend-sub " + (currentRole === "agent" ? "amount-blurred" : "")}>
                        {fmtPrice(Math.round(d.value))} · {pct}% · {d.count != null ? d.count + " " + (d.countLabel || "deals") : (d.countLabel || "")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const attorneyLeaderboard = useMemo(() => {
    const byName = {};
    periodDeals.forEach((d) => {
      const name = (d.att || "").trim();
      if (!name) return;
      if (!byName[name]) byName[name] = { name, deals: 0, value: 0 };
      byName[name].deals += 1;
      byName[name].value += Number(d.agreedOffer) || 0;
    });
    return Object.values(byName).sort((a, b) => b.deals - a.deals);
  }, [periodDeals]);

  const bondThroughLeaderboard = useMemo(() => {
    const byName = {};
    periodDeals.forEach((d) => {
      const name = (d.bondThrough || "").trim();
      if (!name) return;
      if (!byName[name]) byName[name] = { name, deals: 0, bondValue: 0 };
      byName[name].deals += 1;
      byName[name].bondValue += Number(d.bondApplyingFor) || 0;
    });
    return Object.values(byName).sort((a, b) => b.deals - a.deals);
  }, [periodDeals]);

  const agentProfileData = useMemo(() => {
    if (!viewingAgentId) return null;
    const agent = agentsList.find((a) => a.id === viewingAgentId);
    if (!agent) return null;
    const pipelineRow = agentPipeline.find((r) => r.agent.id === viewingAgentId);
    const allMyDeals = deals.filter((d) => d.agent === viewingAgentId || d.listingAgent === viewingAgentId || d.sharedWithAgent === viewingAgentId);
    const myDeals = allMyDeals.filter((d) => {
      const p = parseDealMonth(d.month);
      if (!p || p.year !== selectedYear) return false;
      if (periodMode === "year") return true;
      if (periodMode === "month") return p.mon === selectedMonth;
      return p.quarter === selectedQuarter;
    });
    const periodCommission = agentCommissionTotals[viewingAgentId] || 0;
    const grossFromSales = leaderboard.find((r) => r.agent.id === viewingAgentId)?.gross || 0;
    const suspensive = conditionTotals.byAgent[viewingAgentId]?.suspensive || 0;
    const fallenThrough = conditionTotals.byAgent[viewingAgentId]?.fallenThrough || 0;
    return { agent, pipelineRow, myDeals, periodCommission, grossFromSales, suspensive, fallenThrough };
  }, [viewingAgentId, agentPipeline, deals, agentCommissionTotals, leaderboard, conditionTotals, selectedYear, periodMode, selectedQuarter, selectedMonth]);

  const agentProfileGoals = useMemo(() => {
    if (!viewingAgentId) return null;
    const progress = buildTargetProgress(viewingAgentId, selectedYear);
    const chartData = [1, 2, 3, 4].map((q) => ({
      quarter: "Q" + q,
      target: Math.round(progress.quarterly),
      actual: Math.round(progress.byQuarter[q] || 0),
    }));
    return { ...progress, chartData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingAgentId, selectedYear, deals, agentTargets]);

  const monthlyRevenue = useMemo(() => {
    const byMonth = {};
    deals.forEach((d) => {
      if (!d.month) return;
      if (CONDITION_GROUP[d.conditionStatus] === "FallenThrough") return;
      if (!byMonth[d.month]) byMonth[d.month] = { month: d.month, teamGross: 0, brokerNett: 0 };
      byMonth[d.month].teamGross += Number(d.confirmedCommission) || 0;
      byMonth[d.month].brokerNett += Number(d.nettToKRE) || 0;
    });
    const order = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    return Object.values(byMonth).sort((a, b) => {
      const pa = parseDealMonth(a.month), pb = parseDealMonth(b.month);
      if (pa.year !== pb.year) return pa.year.localeCompare(pb.year);
      return (order[pa.mon] || 0) - (order[pb.mon] || 0);
    });
  }, [deals]);

  const registrationBreakdown = useMemo(() => {
    const confirmedDeals = deals.filter((d) => CONDITION_GROUP[d.conditionStatus] === "Confirmed");
    const registered = [];
    const stillToRegister = [];
    confirmedDeals.forEach((d) => {
      const info = getRegistrationInfo(d);
      (info.registered ? registered : stillToRegister).push({ deal: d, info });
    });

    const registeredByMonth = {};
    registered.forEach(({ deal, info }) => {
      const label = info.monthLabel || "Date unknown";
      if (!registeredByMonth[label]) registeredByMonth[label] = { month: label, count: 0, value: 0 };
      registeredByMonth[label].count += 1;
      registeredByMonth[label].value += Number(deal.confirmedCommission) || 0;
    });

    const forecastByMonth = {};
    stillToRegister.forEach(({ deal, info }) => {
      const label = info.monthLabel || "No expected date set";
      if (!forecastByMonth[label]) forecastByMonth[label] = { month: label, count: 0, value: 0 };
      forecastByMonth[label].count += 1;
      forecastByMonth[label].value += Number(deal.confirmedCommission) || 0;
    });

    return {
      registeredCount: registered.length,
      registeredValue: registered.reduce((s, r) => s + (Number(r.deal.confirmedCommission) || 0), 0),
      stillCount: stillToRegister.length,
      stillValue: stillToRegister.reduce((s, r) => s + (Number(r.deal.confirmedCommission) || 0), 0),
      registeredByMonth: sortByMonthLabel(Object.values(registeredByMonth), (r) => r.month),
      forecastByMonth: sortByMonthLabel(Object.values(forecastByMonth), (r) => r.month),
    };
  }, [deals]);

  const addManualDeal = (agentOverride) => {
    const agentId = agentOverride || currentAgentId;
    api.deals.createDeal({
      leadId: null, month: monthYearLabel(new Date()),
      property: "", suburb: "", askingPrice: 0, openingOffer: 0, conditions: "", bondThrough: "Pending",
      bondApplyingFor: 0, att: "", coSeller: "", coBuyers: "", cco: "", agreedOffer: 0, sharedDeal: "No",
      comPercent: 5, confirmedCommission: 0, suspensive: 0, fallOut: 0, kreNettConfirmed: 0, kreNettSus: 0,
      nettToKRE: 0, stillToRegister: "Yes", expRegDate: "", dealStatus: agentTier(agentId), agent: agentId,
      listingAgent: agentId, sharedWithAgent: "", sharedSplit: "", conditionStatus: "Suspensive Bond",
      buyerName: "", sellerName: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false,
    })
      .then((saved) => {
        setDeals((prev) => [...prev, { ...saved, transferSteps: TRANSFER_STEPS.map((label, i) => ({ key: "step" + i, label, done: false, dateCompleted: "" })) }]);
        return api.deals.addActivity(saved.id, "Deal created");
      })
      .catch((e) => alert("Couldn't create deal: " + e.message));
  };

  const removeDeal = (id) => setDeals((prev) => prev.filter((d) => d.id !== id));

  const roleRestrictedKeys = roleHiddenColumns[currentRole] || [];

  const visibleColumns = useMemo(
    () => columnOrder
      .filter((k) => !hiddenColumns.includes(k) && !roleRestrictedKeys.includes(k))
      .map((k) => DEAL_COLUMN_MAP[k]).filter(Boolean),
    [columnOrder, hiddenColumns, roleRestrictedKeys]
  );

  const toggleColumnVisibility = (key) => {
    setHiddenColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleRoleColumn = (role, key) => {
    const currentlyHidden = (roleHiddenColumns[role] || []).includes(key);
    setRoleHiddenColumns((prev) => {
      const list = prev[role] || [];
      return { ...prev, [role]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] };
    });
    api.permissions.toggleRoleColumn(role, key, !currentlyHidden).catch((e) => console.error("Failed to save column visibility", e));
  };

  const reorderColumn = (draggedKey, targetKey) => {
    if (draggedKey === targetKey) return;
    setColumnOrder((prev) => {
      const next = prev.filter((k) => k !== draggedKey);
      const targetIndex = next.indexOf(targetKey);
      next.splice(targetIndex, 0, draggedKey);
      return next;
    });
  };

  const resetColumns = () => {
    setColumnOrder(DEFAULT_COLUMN_ORDER);
    setHiddenColumns([]);
    setColumnWidths({});
  };

  const startColumnResize = (key, startX, startWidth) => {
    const onMove = (e) => {
      const delta = e.clientX - startX;
      const next = Math.max(70, startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const fallbackYear = String(selectedYear || new Date().getFullYear());
        const parsed = parseDealsWorkbook(evt.target.result, fallbackYear);
        const existingSigs = new Set(deals.map(dealSignature));
        const nameHit = agentsList.find((a) => file.name.toLowerCase().includes(a.name.toLowerCase().split(" ")[0]));
        const agentId = nameHit ? nameHit.id : currentAgentId;
        const newDeals = [];
        let skipped = 0;
        parsed.forEach((rec) => {
          const full = {
            leadId: null,
            month: rec.month || "", property: rec.property || "", suburb: rec.suburb || "",
            askingPrice: rec.askingPrice || 0, openingOffer: rec.openingOffer || 0,
            conditions: rec.conditions || "", bondThrough: rec.bondThrough || "", bondApplyingFor: rec.bondApplyingFor || 0, att: rec.att || "",
            coSeller: rec.coSeller || "", coBuyers: rec.coBuyers || "", cco: rec.cco || "",
            agreedOffer: rec.agreedOffer || 0, sharedDeal: rec.sharedDeal || "",
            comPercent: rec.comPercent || 0, confirmedCommission: (rec.agreedOffer || 0) * (rec.comPercent || 0) / 100,
            suspensive: rec.suspensive || 0, fallOut: rec.fallOut || 0,
            kreNettConfirmed: rec.kreNettConfirmed || 0, kreNettSus: rec.kreNettSus || 0,
            nettToKRE: rec.nettToKRE || 0, stillToRegister: rec.stillToRegister || "",
            expRegDate: rec.expRegDate || "", dealStatus: agentTier(agentId),
            agent: agentId, listingAgent: agentId, sharedWithAgent: "", sharedSplit: "",
            conditionStatus: (rec.confirmedCommission || 0) > 0 ? "Above the line" : (rec.fallOut || 0) > 0 ? "Fallen through" : "Suspensive Bond",
            buyerName: "", sellerName: "", otpSentBuyer: false, otpSentSeller: false, otpSentAttorney: false,
          };
          const sig = dealSignature(full);
          if (existingSigs.has(sig)) { skipped++; return; }
          existingSigs.add(sig);
          newDeals.push(full);
        });
        if (newDeals.length) {
          await api.deals.bulkInsertDeals(newDeals);
          setDeals(await api.deals.fetchDeals().then((rows) => rows.map((d) => ({
            ...d,
            transferSteps: TRANSFER_STEPS.map((label, i) => {
              const row = (d.transferStepRows || []).find((s) => s.step_index === i);
              return { key: "step" + i, label, done: row?.done || false, dateCompleted: row?.date_completed || "" };
            }),
          }))));
        }
        setImportSummary({ added: newDeals.length, skipped, agentName: agentName(agentId), fileName: file.name });
      } catch (err) {
        setImportSummary({ error: "Couldn't read \u201c" + file.name + "\u201d — check it's a valid .xlsx export." });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  if (dataLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1526", color: "#fff", fontSize: 14 }}>
        Loading your data…
      </div>
    );
  }
  if (dataError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1526", color: "#fff", fontSize: 14, gap: 12 }}>
        <div>Couldn't load data: {dataError}</div>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="crm-root">
      <style>{`
        .crm-root {
          --ink: #02658F;
          --ink-soft: #0B7CA8;
          --paper: #F6F4EF;
          --panel: #FFFFFF;
          --charcoal: #24232A;
          --slate: #8B8D98;
          --line: #E3DFD5;
          --brass: #FBDB16;
          --brass-light: #FCE55C;
          --brass-wash: #FDF3CB;
          --sage: #5E7D5E;
          --sage-wash: #E5EDE3;
          --clay: #A6543E;
          --clay-wash: #F3E3DE;
          --blue-wash: #E2E9F3;
          --blue-ink: #02658F;
          --green-wash: #E1EFE0;
          --green-ink: #3E6B3F;

          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--charcoal);
          background: var(--paper);
          display: flex;
          min-height: 640px;
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
        }
        .crm-root * { box-sizing: border-box; }
        .crm-display { font-family: 'Fraunces', Georgia, serif; }
        .crm-mono { font-family: 'IBM Plex Mono', monospace; }

        /* Sidebar */
        .sidebar {
          width: 216px;
          flex-shrink: 0;
          background: var(--ink);
          color: #E9E7DE;
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 8px 20px 8px;
          border-bottom: 1px solid rgba(233,231,222,0.14);
          margin-bottom: 16px;
        }
        .brand-logo {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          flex-shrink: 0;
          object-fit: cover;
        }
        .brand-mark {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: -0.01em;
          line-height: 1;
          background: linear-gradient(120deg, #FCE988 0%, var(--brass) 55%, #C79A2E 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          display: inline-block;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
        }
        .brand-sub {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--brass-light);
          line-height: 1.35;
          margin-top: 2px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 7px;
          font-size: 13.5px;
          color: #C9CADA;
          cursor: pointer;
          margin-bottom: 2px;
          transition: background 0.15s, color 0.15s;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .nav-item.active { background: var(--brass); color: var(--ink); font-weight: 600; }
        .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; }
        .vertical-switch {
          display: flex; gap: 2px; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 3px; margin-bottom: 10px;
        }
        .vertical-switch button {
          flex: 1; background: none; border: none; cursor: pointer; padding: 6px 0; border-radius: 6px;
          font-size: 12px; font-weight: 600; color: #C9CADA;
        }
        .vertical-switch button.active { background: var(--brass); color: var(--ink); }
        .sidebar-foot {
          margin-top: auto;
          padding: 10px 8px;
          font-size: 11px;
          color: #8991AC;
          border-top: 1px solid rgba(233,231,222,0.14);
          padding-top: 14px;
        }
        .integration-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(169,131,79,0.16);
          border: 1px solid rgba(169,131,79,0.4);
          color: var(--brass-light);
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 11px;
          margin-top: 8px;
        }

        /* Main */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--paper);
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 26px;
          border-bottom: 1px solid var(--line);
          background: var(--panel);
        }
        .topbar h1 {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .topbar-eyebrow {
          font-size: 10.5px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--slate);
          margin-bottom: 2px;
        }
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 22px 26px 30px 26px;
        }

        /* Stat cards */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }
        .stat-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 16px 16px;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--slate);
          margin-bottom: 8px;
        }
        .stat-value {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--ink);
        }

        .panel {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 10px;
        }
        .panel-head {
          padding: 14px 18px;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .panel-head h3 {
          font-family: 'Fraunces', serif;
          font-size: 15px;
          font-weight: 600;
          margin: 0;
        }

        /* Source bars */
        .source-row { display: flex; align-items: center; gap: 10px; padding: 10px 18px; }
        .source-row:not(:last-child) { border-bottom: 1px solid var(--line); }
        .source-bar-track { flex: 1; height: 8px; background: #EFEBE1; border-radius: 4px; overflow: hidden; }
        .source-bar-fill { height: 100%; border-radius: 4px; }

        /* Badges */
        .badge {
          display: inline-flex;
          align-items: center;
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .src-p24 { background: var(--blue-wash); color: var(--blue-ink); }
        .src-pp { background: var(--green-wash); color: var(--green-ink); }
        .src-web { background: var(--brass-wash); color: #6B4F26; }
        .status-badge { background: #EFEBE1; color: var(--charcoal); }
        .status-New { background: var(--blue-wash); color: var(--blue-ink); }
        .status-Contacted { background: var(--brass-wash); color: #6B4F26; }
        .status-Viewing.Booked, .status-Viewing { background: #EFE6F5; color: #6B4A87; }
        .status-Offer.Made, .status-Offer { background: #FCEBD5; color: #8A5A17; }
        .status-Sold { background: var(--green-wash); color: var(--green-ink); }
        .status-Lost { background: var(--clay-wash); color: var(--clay); }

        /* Leads list */
        .lead-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1.6fr 0.9fr 0.9fr auto;
          gap: 10px;
          align-items: center;
          padding: 12px 18px;
          cursor: pointer;
          border-bottom: 1px solid var(--line);
        }
        .lead-row:hover { background: #FBFAF6; }
        .lead-row:last-child { border-bottom: none; }
        .lead-name { font-weight: 600; font-size: 13.5px; }
        .lead-sub { font-size: 12px; color: var(--slate); margin-top: 1px; }
        .filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
        .select, .search-input {
          border: 1px solid var(--line);
          background: var(--panel);
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 12.5px;
          color: var(--charcoal);
        }
        .search-wrap { position: relative; flex: 1; min-width: 180px; }
        .search-wrap svg { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--slate); }
        .search-input { width: 100%; padding-left: 30px; }

        /* Kanban */
        .kanban { display: grid; grid-template-columns: repeat(6, minmax(160px,1fr)); gap: 12px; align-items: start; }
        .kanban-col { background: #F1EEE5; border-radius: 10px; padding: 10px; min-height: 200px; }
        .kanban-eyebrow { font-size: 10px; color: var(--brass); font-weight: 700; letter-spacing: 0.06em; }
        .kanban-title { font-family: 'Fraunces', serif; font-size: 13px; font-weight: 600; margin: 2px 0 10px 0; }
        .kanban-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .kanban-card:hover { border-color: var(--brass-light); }
        .kanban-card .name { font-weight: 600; font-size: 12.5px; margin-bottom: 3px; }
        .kanban-card .addr { color: var(--slate); font-size: 11.5px; }

        /* Listings grid */
        .listing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .listing-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
        .listing-photo {
          height: 92px;
          background: linear-gradient(135deg, var(--ink), var(--ink-soft));
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.5);
        }
        .listing-body { padding: 12px 14px; }
        .listing-ref { font-size: 10.5px; color: var(--slate); }
        .listing-addr { font-weight: 600; font-size: 13.5px; margin: 2px 0 2px 0; }
        .listing-suburb { font-size: 12px; color: var(--slate); display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
        .listing-price { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--ink); font-size: 15px; }
        .listing-meta { display: flex; gap: 12px; color: var(--slate); font-size: 11.5px; margin-top: 8px; }
        .listing-meta span { display: flex; align-items: center; gap: 3px; }
        .portal-row { display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap; }

        /* Agents */
        .agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
        .agent-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; font-family: inherit; }
        .agent-card:hover { border-color: var(--brass); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .profile-header { display: flex; align-items: center; gap: 16px; }
        .goal-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .agent-avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: var(--brass); color: var(--ink);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; margin: 0 auto 10px auto; font-family: 'Fraunces', serif;
        }
        .agent-name { font-weight: 600; font-size: 13.5px; }
        .agent-stat { font-size: 11.5px; color: var(--slate); margin-top: 3px; }

        /* Drawer */
        .drawer-overlay {
          position: absolute; inset: 0; background: rgba(27,36,56,0.35);
          display: flex; justify-content: flex-end; z-index: 20;
        }
        .register-confirm-modal {
          width: 340px; background: var(--panel); border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.22); overflow: hidden;
        }
        .drawer {
          width: 360px; background: var(--panel); height: 100%;
          box-shadow: -8px 0 24px rgba(0,0,0,0.12);
          display: flex; flex-direction: column;
        }
        .drawer-head {
          padding: 18px 20px; border-bottom: 1px solid var(--line);
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .drawer-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
        .drawer-close { background: none; border: none; cursor: pointer; color: var(--slate); padding: 4px; }
        .field-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--slate); margin-bottom: 4px; margin-top: 16px; }
        .field-value { font-size: 13.5px; display: flex; align-items: center; gap: 6px; }
        .msg-box { background: #F8F6F0; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 12.5px; line-height: 1.5; margin-top: 6px; }
        .stage-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .stage-btn {
          border: 1px solid var(--line); background: var(--panel); border-radius: 6px;
          padding: 5px 9px; font-size: 11.5px; cursor: pointer; color: var(--charcoal);
        }
        .stage-btn.active { background: var(--ink); color: #fff; border-color: var(--ink); }
        .agent-select { width: 100%; margin-top: 6px; padding: 7px 9px; border: 1px solid var(--line); border-radius: 7px; font-size: 12.5px; }

        .action-row { display: flex; gap: 8px; padding: 0 20px 14px 20px; }
        .action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: 7px; padding: 8px 10px; font-size: 12px; font-weight: 600;
          text-decoration: none; cursor: pointer; border: 1px solid transparent;
        }
        .action-btn.wa { background: var(--green-wash); color: var(--green-ink); border-color: #C9DEC7; }
        .action-btn.ol { background: var(--blue-wash); color: var(--blue-ink); border-color: #C7D3E4; }
        .drawer-tabs { display: flex; gap: 4px; padding: 0 20px; border-bottom: 1px solid var(--line); }
        .drawer-tab {
          background: none; border: none; cursor: pointer; padding: 9px 4px; margin-right: 16px;
          font-size: 12.5px; font-weight: 600; color: var(--slate); border-bottom: 2px solid transparent;
        }
        .drawer-tab.active { color: var(--ink); border-bottom-color: var(--brass); }
        .req-input {
          width: 100%; padding: 7px 9px; border: 1px solid var(--line); border-radius: 7px;
          font-size: 12.5px; margin-top: 2px; background: var(--panel); color: var(--charcoal);
        }
        .req-input-wrap {
          display: flex; align-items: center; gap: 6px; border: 1px solid var(--line);
          border-radius: 7px; padding: 0 9px; margin-top: 2px;
        }
        .req-input-wrap span { color: var(--slate); font-size: 12px; }
        .req-input-wrap .req-input { border: none; padding: 7px 0; margin-top: 0; }
        .req-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .req-checkbox { display: flex; align-items: center; gap: 7px; font-size: 12.5px; margin-top: 14px; cursor: pointer; }
        .req-divider {
          display: flex; align-items: center; gap: 6px; margin-top: 22px; padding-top: 14px;
          border-top: 1px solid var(--line); font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--brass);
        }
        .req-note {
          display: flex; align-items: flex-start; gap: 6px; margin-top: 20px; padding: 10px 12px;
          background: #F8F6F0; border-radius: 8px; font-size: 11.5px; color: var(--slate); line-height: 1.5;
        }

        .ms-todo-bar {
          display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px 12px;
          background: var(--panel); border: 1px solid var(--line); border-radius: 8px; font-size: 12.5px; color: var(--charcoal);
        }

        /* Deals — flat summary row, "Details" opens the deal drawer for
           everything else (contacts, suspensive conditions, extra terms). */
        .simple-deal-list { overflow: hidden; }
        .simple-deal-row {
          display: grid;
          grid-template-columns: minmax(220px, 1.45fr) minmax(150px, 0.8fr) minmax(110px, 0.62fr) minmax(120px, 0.7fr) minmax(120px, 0.72fr) minmax(120px, 0.72fr) minmax(140px, 0.78fr) minmax(260px, auto);
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--line);
        }
        .simple-deal-row:last-child { border-bottom: none; }
        .simple-deal-row:hover { background: #FBFAF6; }
        .simple-deal-main { min-width: 0; }
        .simple-deal-main .lead-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .simple-deal-money { text-align: right; }
        .simple-deal-detail { font-size: 12.5px; color: var(--charcoal); }
        .simple-deal-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 1180px) {
          .simple-deal-row { grid-template-columns: 1fr 1fr; align-items: start; }
          .simple-deal-money { text-align: left; }
          .simple-deal-actions { justify-content: flex-start; grid-column: 1 / -1; }
        }

        /* Offers — Kanban pipeline. Drag a card between columns; dropping
           on Agreed/No deal changes the offer's outcome directly. */
        .offer-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: start; }
        .offer-board-col { background: #F8F6F0; border-radius: 10px; padding: 10px; min-height: 80px; }
        .offer-board-col-head {
          display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.03em; color: var(--slate); margin-bottom: 8px; padding: 0 2px;
        }
        .offer-board-col-head span { color: var(--charcoal); font-weight: 600; }
        .offer-board-empty { text-align: center; font-size: 11.5px; color: #C8C4B8; padding: 14px 0; border: 1px dashed var(--line); border-radius: 8px; }
        .offer-card {
          background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px 11px;
          margin-bottom: 8px; cursor: grab; box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .offer-card:active { cursor: grabbing; }
        .offer-card:hover { border-color: var(--brass); }
        .offer-card-agent { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--slate); margin-bottom: 6px; }
        .offer-card-property { font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .offer-card-buyers { font-size: 11.5px; color: var(--slate); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .offer-card-foot { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .offer-card-foot .crm-mono { font-weight: 700; color: var(--ink); }
        @media (max-width: 1100px) {
          .offer-board { grid-template-columns: 1fr 1fr; }
        }

        .import-banner { align-items: center; background: var(--green-wash); color: var(--green-ink); }
        .import-banner.import-error { background: var(--clay-wash); color: var(--clay); }
        .import-banner .drawer-close { color: inherit; }

        /* Leaderboard */
        .leaderboard-row {
          display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line);
          width: 100%; background: none; border-left: none; border-right: none; border-top: none; cursor: pointer;
          font-family: inherit; text-align: left;
        }
        .leaderboard-row:hover { background: #FBFAF6; }
        .leaderboard-row-locked { cursor: default; }
        .leaderboard-row-locked:hover { background: none; }
        .leaderboard-row:last-child { border-bottom: none; }
        .rank-badge {
          width: 26px; height: 26px; border-radius: 50%; background: #EFEBE1; color: var(--slate);
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;
        }
        .leaderboard-row.rank-1 .rank-badge { background: var(--brass); color: var(--ink); }
        .leaderboard-row.rank-2 .rank-badge { background: #D8D9DE; color: #4B4D57; }
        .leaderboard-row.rank-3 .rank-badge { background: #E0C09A; color: #6B4520; }
        .leaderboard-amount { font-weight: 700; font-size: 14px; color: var(--ink); }
        .amount-blurred { filter: blur(5px); user-select: none; }

        /* Nav badge */
        .nav-count {
          margin-left: auto; background: var(--clay); color: #fff; font-size: 10px; font-weight: 700;
          border-radius: 10px; padding: 1px 6px; min-width: 16px; text-align: center;
        }

        /* Agent switcher (topbar) */
        .agent-switcher { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--slate); }
        .topbar-controls { display: flex; align-items: center; gap: 18px; }
        .locked-agent-name { font-size: 12.5px; font-weight: 600; color: var(--charcoal); min-width: 150px; }
        .agent-switcher .select { min-width: 150px; }

        /* Collaborators */
        .collab-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .collab-chip {
          display: flex; align-items: center; gap: 5px; border: 1px solid var(--line); background: var(--panel);
          border-radius: 20px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; color: var(--slate);
        }
        .collab-chip.active { background: var(--blue-wash); color: var(--blue-ink); border-color: #C7D3E4; }

        /* Notes / timeline */
        .note-textarea { min-height: 64px; resize: vertical; font-family: inherit; }
        .timeline { margin-top: 8px; }
        .timeline-item {
          padding: 10px 0; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 4px;
        }
        .timeline-item:last-child { border-bottom: none; }
        .timeline-text { font-size: 12.5px; line-height: 1.5; }
        .timeline-meta { font-size: 11px; color: var(--slate); }
        .note-typeCall { background: var(--blue-wash); color: var(--blue-ink); }
        .note-typeEmail { background: var(--brass-wash); color: #6B4F26; }
        .note-typeWhatsApp { background: var(--green-wash); color: var(--green-ink); }
        .note-typeViewingBooked { background: #EFE6F5; color: #6B4A87; }
        .note-typeViewingFeedback { background: #FCEBD5; color: #8A5A17; }
        .note-typeSystem { background: #EFEBE1; color: var(--slate); }
        .note-typeFollowup { background: var(--clay-wash); color: var(--clay); }
        .note-typeNote { background: var(--brass-wash); color: #6B4F26; }
        .note-typeMeeting { background: #EFE6F5; color: #6B4A87; }

        .quick-note-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .quick-note-chip {
          border: 1px solid var(--line); background: var(--panel); border-radius: 20px; padding: 5px 10px;
          font-size: 11.5px; color: var(--slate); cursor: pointer;
        }
        .quick-note-chip:hover { background: var(--brass-wash); color: #6B4F26; border-color: var(--brass-light); }

        /* To-dos */
        .todo-row {
          display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line);
        }
        .todo-row:last-child { border-bottom: none; }
        .todo-row.done { opacity: 0.55; }
        .todo-row.done .todo-label { text-decoration: line-through; }
        .todo-check { background: none; border: none; cursor: pointer; color: var(--brass); padding: 0; display: flex; }
        .todo-row.done .todo-check { color: var(--sage); }
        .todo-label { font-size: 13px; font-weight: 600; }

        .todo-row-overdue { background: var(--clay-wash); }
        .todo-row-overdue .todo-check { color: var(--clay); }
        .overdue-flag {
          display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px;
          border-radius: 50%; background: var(--clay); color: #fff; font-size: 10px; font-weight: 800;
          margin-right: 6px; flex-shrink: 0;
        }
        .overdue-text { color: var(--clay); font-weight: 700; }

        /* Access control */
        .access-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-bottom: 1px solid var(--line);
          cursor: pointer;
        }
        .access-row:last-child { border-bottom: none; }
        .access-row:hover { background: #FBFAF6; }
        .access-row-name { font-size: 13px; font-weight: 600; flex: 1; }

        /* Canvassing: view toggle + legend */
        .view-toggle { display: flex; gap: 4px; background: #EFEBE1; border-radius: 8px; padding: 3px; }
        .toggle-btn {
          display: flex; align-items: center; gap: 5px; border: none; background: none; cursor: pointer;
          padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--slate);
        }
        .toggle-btn.active { background: var(--panel); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .dk-legend { display: flex; gap: 12px; flex-wrap: wrap; margin-left: auto; }
        .dk-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--slate); }
        .dk-dot-swatch { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

        /* Canvassing: status colors */
        .dk-grey { background: #9CA0AC; color: #fff; }
        .dk-blue { background: var(--blue-ink); color: #fff; }
        .dk-clay { background: var(--clay); color: #fff; }
        .dk-gold { background: var(--brass); color: var(--ink); }
        .dk-purple { background: #8B5FA8; color: #fff; }
        .dk-green { background: var(--sage); color: #fff; }
        span.dk-grey, span.dk-blue, span.dk-clay, span.dk-gold, span.dk-purple, span.dk-green {
          font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 20px;
        }

        /* Canvassing: map */
        /* Area Canvas board */
        .canvas-intro { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; margin-bottom: 14px; }
        .canvas-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; align-items: start; }
        .canvas-col { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .canvas-col-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
        .canvas-col-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 14px; color: var(--charcoal); }
        .canvas-col-count {
          background: #EFEBE1; color: var(--slate); font-size: 11px; font-weight: 700;
          border-radius: 20px; padding: 2px 9px; margin-left: auto;
        }
        .canvas-col-body { max-height: 640px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .canvas-empty { padding: 24px 10px; text-align: center; color: var(--slate); font-size: 12.5px; }
        .canvas-card {
          background: #FBFAF6; border: 1px solid var(--line); border-radius: 10px; padding: 12px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .canvas-card-addr { font-weight: 700; font-size: 13px; color: var(--charcoal); line-height: 1.3; }
        .canvas-card-owner { font-size: 12px; color: var(--slate); }
        .canvas-card-meta { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--slate); margin-top: 2px; }
        .canvas-card-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .canvas-card-actions .stage-btn { font-size: 11px; padding: 5px 9px; }
        .canvas-leader-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line); }
        .canvas-leader-row:last-child { border-bottom: none; }
        .kpi-period-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .kpi-period-label { font-size: 13px; font-weight: 700; color: var(--charcoal); min-width: 160px; text-align: center; }

        /* Merge requests */
        .merge-request-row {
          display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--line);
        }
        .merge-request-row:last-child { border-bottom: none; }
        .merge-request-col { flex: 1; min-width: 0; }
        .merge-request-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        .danger-text { color: var(--clay); }

        .dk-map {
          position: relative; width: 100%; height: 460px; border-radius: 10px; overflow: hidden;
          border: 1px solid var(--line);
        }
        .dk-map-bg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .dk-pin {
          position: absolute; transform: translate(-50%, -50%); border: 2px solid #fff; cursor: pointer;
          border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 1;
        }
        .dk-pin:hover { z-index: 5; transform: translate(-50%, -50%) scale(1.15); }
        .dk-tooltip {
          position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%);
          background: var(--ink); color: #fff; border-radius: 8px; padding: 10px 12px; width: 200px;
          font-size: 11.5px; line-height: 1.5; text-align: left; box-shadow: 0 6px 18px rgba(0,0,0,0.28); z-index: 10;
        }
        .dk-tooltip-addr { font-weight: 700; margin-bottom: 3px; }
        .dk-tooltip-row { color: #D8DAE6; margin-top: 2px; }

        /* Valuation */
        .valuation-card { background: #F8F6F0; border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin-top: 8px; }
        .file-input-label {
          display: flex; align-items: center; gap: 8px; border: 1px dashed var(--line); border-radius: 7px;
          padding: 9px 11px; font-size: 12.5px; color: var(--slate); cursor: pointer; margin-top: 4px;
        }
        .file-input-label:hover { border-color: var(--brass); color: var(--ink); }

        /* Team pipeline table */
        .pipeline-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 760px; }
        .pipeline-table th {
          text-align: left; padding: 10px 14px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--slate); border-bottom: 1px solid var(--line); white-space: nowrap;
        }
        .pipeline-table td {
          padding: 9px 14px; border-bottom: 1px solid var(--line); white-space: nowrap;
        }
        .pipeline-table tbody tr:hover { background: #FBFAF6; }
        .pipeline-table tfoot td {
          font-weight: 700; border-top: 2px solid var(--line); border-bottom: none; background: #F8F6F0;
        }
        .pt-count { text-align: center; }
        .pt-zero { color: #C8C4B8; }
        .agent-link {
          display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; color: var(--charcoal); padding: 0;
        }
        .agent-link:hover { color: var(--ink); text-decoration: underline; }
        .agent-avatar-sm {
          width: 22px; height: 22px; border-radius: 50%; background: var(--brass); color: var(--ink);
          display: flex; align-items: center; justify-content: center; font-size: 9.5px; font-weight: 700;
          font-family: 'Fraunces', serif; flex-shrink: 0;
        }

        /* Deal ledger */
        .deal-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 2100px; }
        .deal-table th {
          text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em;
          color: var(--slate); border-bottom: 1px solid var(--line); white-space: nowrap; background: #F8F6F0;
          position: sticky; top: 0;
        }
        .deal-table td { padding: 4px 6px; border-bottom: 1px solid var(--line); }
        .deal-table tbody tr:hover { background: #FBFAF6; }
        .cell-input {
          width: 100%; min-width: 88px; border: 1px solid transparent; background: transparent;
          padding: 5px 6px; font-size: 12px; border-radius: 5px; color: var(--charcoal); font-family: inherit;
        }
        .cell-input:hover { border-color: var(--line); }
        .split-disabled { display: block; padding: 5px 6px; font-size: 12px; color: #C8C4B8; font-style: italic; }
        .deal-row-readonly { opacity: 0.55; background: #FAFAF7; }
        .offer-dead-section { opacity: 0.75; }
        .offer-fallthrough-section { border-left: 3px solid #8B5FA8; }
        .badge-fellthrough { background: #EFE6F5; color: #6B4A87; font-weight: 700; }
        .deal-row-readonly:hover { background: #FAFAF7; }
        .cell-input:focus { border-color: var(--brass); background: var(--panel); outline: none; }
        select.cell-input { cursor: pointer; }
        .row-remove { background: none; border: none; color: var(--slate); cursor: pointer; padding: 4px; display: flex; }
        .row-remove:hover { color: var(--clay); }

        /* Locked Agent + Property columns, and a fixed-height scroll area so
           the horizontal scrollbar and header are always visible without
           having to scroll the whole page */
        .deal-table-scroll-area { overflow: auto; height: 65vh; min-height: 420px; }
        .deal-table thead th { position: sticky; top: 0; z-index: 4; background: #F8F6F0; }
        .deal-table th.col-sticky, .deal-table td.col-sticky { position: sticky; z-index: 3; background: var(--panel); }
        .deal-table thead th.col-sticky { z-index: 6; background: #F8F6F0; }
        .col-sticky-1 { left: 0; min-width: 130px; width: 130px; }
        .col-sticky-2 { left: 130px; min-width: 170px; width: 170px; box-shadow: 2px 0 4px rgba(0,0,0,0.06); }

        /* Offers */
        .offer-status-select { font-weight: 700; min-width: 130px; }
        .offer-status-select.offer-pending { background: #EFEBE1; color: var(--slate); }
        .offer-status-select.offer-yes { background: var(--green-wash); color: var(--green-ink); }
        .offer-status-select.offer-no { background: var(--clay-wash); color: var(--clay); }
        .offer-converted-btn {
          border: none; cursor: pointer; font-weight: 700; white-space: nowrap; padding: 6px 10px;
        }
        .offer-table .req-input-wrap { min-width: 120px; }

        /* Draggable / resizable column headers */
        .deal-table th.col-draggable {
          position: relative; cursor: grab; user-select: none; padding-right: 14px;
        }
        .deal-table th.col-draggable.dragging { opacity: 0.4; background: var(--brass-wash); }
        .col-th-label { display: flex; align-items: center; gap: 4px; }
        .col-th-label .drag-handle { color: #C8C4B8; flex-shrink: 0; }
        .col-resize-handle {
          position: absolute; top: 0; right: 0; width: 8px; height: 100%; cursor: col-resize;
        }
        .col-resize-handle:hover { background: var(--brass); opacity: 0.5; }

        /* Customize columns panel */
        .column-panel-backdrop { position: fixed; inset: 0; z-index: 19; background: transparent; }
        .column-panel {
          position: absolute; top: calc(100% + 6px); left: 0; width: 260px; background: var(--panel);
          border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 20; max-height: 360px; display: flex; flex-direction: column;
        }
        .column-panel-head {
          display: flex; justify-content: space-between; align-items: center; padding: 10px 12px;
          border-bottom: 1px solid var(--line); font-size: 11px; color: var(--slate);
        }
        .link-btn { background: none; border: none; color: var(--blue-ink); cursor: pointer; font-size: 11.5px; font-weight: 600; }
        .column-panel-list { overflow-y: auto; padding: 6px; }
        .column-panel-row {
          display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; cursor: grab;
        }
        .column-panel-row:hover { background: #F8F6F0; }
        .column-panel-row.dragging { opacity: 0.4; }
        .column-panel-row .drag-handle { color: #C8C4B8; flex-shrink: 0; }
        .column-panel-row label { display: flex; align-items: center; gap: 7px; font-size: 12.5px; cursor: pointer; flex: 1; }
        .computed-cell {
          padding: 8px 10px !important; background: #F8F6F0; font-weight: 700; color: var(--ink);
          white-space: nowrap;
        }
        .computed-cell .lead-sub { font-weight: 400; margin-top: 2px; }

        .deal-gold { background: var(--brass-wash); color: #6B4F26; font-weight: 700; }
        .deal-silver { background: #E7E8EC; color: #4B4D57; font-weight: 700; }
        .deal-yellow { background: #FFF3B0; color: #7A5B00; font-weight: 700; }
        .deal-blue { background: var(--blue-wash); color: var(--blue-ink); font-weight: 700; }
        .cond-select { font-weight: 700; min-width: 160px; }
        .cond-confirmed { background: var(--green-wash); color: var(--green-ink); }
        .cond-suspensive { background: #FCEBD5; color: #8A5A17; }
        .cond-fallen { background: var(--clay-wash); color: var(--clay); }
        .stat-card-fallen { border-color: #E8CFC5; }
        .stat-card-fallen .stat-value { color: var(--clay); }

        /* Transfer progress */
        .transfer-progress-btn {
          display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer;
          font-size: 11.5px; font-family: inherit; color: var(--charcoal); padding: 4px 2px; white-space: nowrap;
        }
        .transfer-progress-track {
          width: 60px; height: 7px; background: #EFEBE1; border-radius: 4px; overflow: hidden; flex-shrink: 0;
        }
        .transfer-progress-fill { height: 100%; background: var(--sage); border-radius: 4px; }

        /* Deal drawer detail grid — used inside the "Details" drawer opened
           from the Deals list. */
        .deal-card-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px 14px;
        }
        .deal-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .deal-field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--slate); }
        .deal-field .cell-input { border-color: var(--line); background: #FBFAF6; }
        .deal-field .computed-cell { padding: 5px 6px !important; background: #F8F6F0; border-radius: 5px; font-size: 12px; }
        .deal-field .split-disabled { padding: 5px 6px; }
        .deal-card-contacts {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; padding-bottom: 14px;
          border-bottom: 1px solid var(--line);
        }
        .deal-conditions-block { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
        .deal-conditions-head {
          display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.03em; color: var(--slate); margin-bottom: 6px;
        }
        .deal-condition-row {
          display: flex; align-items: center; gap: 8px; padding: 7px 0; border-top: 1px solid var(--line);
        }
        .deal-condition-row .cell-input { border-color: var(--line); background: #FBFAF6; }
        .deal-condition-add-form {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line);
        }
        .deal-condition-add-form > div { grid-column: 1 / -1; }

        /* Contact picker — search-or-create combobox used for Purchaser/
           Seller on offers and deals. */
        .contact-picker { position: relative; }
        .contact-picker-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--panel);
          border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 25; max-height: 260px; overflow-y: auto; padding: 4px;
        }
        .contact-picker-row {
          display: flex; flex-direction: column; align-items: flex-start; gap: 1px; width: 100%;
          background: none; border: none; text-align: left; cursor: pointer; padding: 7px 9px; border-radius: 6px;
        }
        .contact-picker-row:hover { background: #F8F6F0; }
        .contact-picker-row-name { font-size: 12.5px; font-weight: 600; color: var(--charcoal); }
        .contact-picker-row-sub { font-size: 11px; color: var(--slate); }
        .contact-picker-empty { padding: 8px 9px; font-size: 11.5px; color: var(--slate); font-style: italic; }
        .contact-picker-add {
          display: block; width: 100%; text-align: left; background: none; border: none; cursor: pointer;
          padding: 8px 9px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--ink);
          border-top: 1px solid var(--line); margin-top: 2px;
        }
        .contact-picker-add:hover { background: #F8F6F0; }
        .contact-picker-create { padding: 6px; display: flex; flex-direction: column; gap: 6px; }
        .contact-picker-linked { display: flex; align-items: center; gap: 6px; }
        .contact-chip {
          display: inline-flex; align-items: center; gap: 6px; background: var(--sage-wash); border: 1px solid #C9DEC7;
          border-radius: 20px; padding: 4px 10px; cursor: pointer; font-family: inherit; max-width: 100%;
        }
        .contact-chip-name { font-size: 12px; font-weight: 600; color: var(--green-ink); }
        .contact-chip-cat { font-size: 10.5px; color: var(--green-ink); opacity: 0.75; white-space: nowrap; }
        .contact-row-linkable { cursor: pointer; }
        .contact-row-linkable:hover { background: #FBFAF6; }
        .contact-history-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--line); }
        .contact-history-row:last-child { border-bottom: none; }
        .contact-history-date { font-size: 11px; color: var(--slate); width: 68px; flex-shrink: 0; }

        /* Target tracking */
        .target-progress-track { width: 100%; height: 12px; background: #EFEBE1; border-radius: 6px; overflow: hidden; }
        .target-progress-fill { height: 100%; background: linear-gradient(90deg, var(--brass), var(--sage)); border-radius: 6px; }

        /* Donut cards */
        .donut-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px; }
        .donut-card {
          background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 18px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .donut-card-head {
          display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;
        }
        .donut-card-head h3 {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: var(--charcoal); margin: 0;
        }
        .donut-card-total { font-size: 16px; font-weight: 700; color: var(--ink); white-space: nowrap; }
        .donut-card-body { display: flex; align-items: center; gap: 16px; }
        .donut-chart-wrap { position: relative; width: 132px; height: 132px; flex-shrink: 0; }
        .donut-center-label {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 12px; letter-spacing: 0.04em;
          color: var(--ink); pointer-events: none;
        }
        .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 9px; min-width: 0; }
        .donut-legend-item { display: flex; align-items: flex-start; gap: 7px; }
        .donut-swatch { width: 10px; height: 10px; border-radius: 3px; margin-top: 3px; flex-shrink: 0; }
        .donut-legend-name { font-size: 12px; font-weight: 700; color: var(--charcoal); line-height: 1.3; }
        .donut-legend-sub { font-size: 11px; color: var(--slate); line-height: 1.3; }
        @media (max-width: 1000px) {
          .donut-row { grid-template-columns: 1fr; }
        }
        .pace-ahead { color: var(--sage); }
        .pace-behind { color: var(--clay); }
        .transfer-drawer { width: 460px; }
        .transfer-summary { display: flex; align-items: center; gap: 10px; margin: 16px 0; }

        /* OTP (Offer to Purchase) */
        .otp-task-pending { color: var(--clay); }
        .otp-task-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 13px; }
        .otp-file-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 12.5px; }
        .otp-file-row a { color: var(--blue-ink); font-weight: 600; text-decoration: underline; }
        .otp-send-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .otp-send-label { width: 56px; font-size: 12px; font-weight: 700; color: var(--slate); flex-shrink: 0; }
        .otp-send-row .req-input { margin-top: 0; flex: 1; }
        .otp-sent-check { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--slate); white-space: nowrap; }
        .otp-send-row .stage-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .stage-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .otp-preview { margin-top: 4px; margin-left: 64px; }
        .otp-preview summary { font-size: 11px; color: var(--blue-ink); cursor: pointer; font-weight: 600; }
        .otp-preview pre {
          white-space: pre-wrap; font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.6;
          background: #F8F6F0; border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin-top: 6px;
        }
        .transfer-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .transfer-table th {
          text-align: left; padding: 8px 6px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--slate); border-bottom: 1px solid var(--line);
        }
        .transfer-table td { padding: 8px 6px; border-bottom: 1px dashed var(--line); vertical-align: middle; }
        .transfer-table tr.step-done td:first-child { color: var(--slate); }
        .step-check { background: none; border: none; cursor: pointer; color: #C8C4B8; display: flex; padding: 0; }
        .step-check.done { color: var(--sage); }
        .transfer-table input[type="date"] { min-width: 128px; }

        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2,1fr); }
          .listing-grid { grid-template-columns: repeat(2,1fr); }
          .agent-grid { grid-template-columns: repeat(2,1fr); }
          .kanban { grid-template-columns: repeat(3, minmax(150px,1fr)); }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&family=Space+Grotesk:wght@600;700&display=swap');`}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand">
          <img src={LOGO_SRC} alt="Kingstons Real Estate" className="brand-logo" />
          <div>
            <div className="brand-mark">KORE</div>
            <div className="brand-sub">Kingstons Operations &amp; Real Estate</div>
          </div>
        </div>
        {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
          <div className="vertical-switch">
            <button className={activeVertical === "sales" ? "active" : ""} onClick={() => { setActiveVertical("sales"); setNav("dashboard"); }}>Sales</button>
            <button className={activeVertical === "rentals" ? "active" : ""} onClick={() => { setActiveVertical("rentals"); setNav("rentaloffers"); }}>Rentals</button>
          </div>
        )}
        {showInMySidebar("dashboard") && (
          <button className={"nav-item " + (nav === "dashboard" ? "active" : "")} onClick={() => setNav("dashboard")}>
            <LayoutDashboard /> Dashboard
          </button>
        )}
        {showInMySidebar("leads") && (
          <button className={"nav-item " + (nav === "leads" ? "active" : "")} onClick={() => setNav("leads")}>
            <Inbox /> Leads
          </button>
        )}
        {showInMySidebar("pipeline") && (
          <button className={"nav-item " + (nav === "pipeline" ? "active" : "")} onClick={() => setNav("pipeline")}>
            <Kanban /> Pipeline
          </button>
        )}
        {showInMySidebar("canvassing") && (
          <button className={"nav-item " + (nav === "canvassing" ? "active" : "")} onClick={() => setNav("canvassing")}>
            <Compass /> Canvassing
          </button>
        )}
        {activeVertical === "sales" && showInMySidebar("teampipeline") && (
          <button className={"nav-item " + (nav === "teampipeline" ? "active" : "")} onClick={() => setNav("teampipeline")}>
            <TrendingUp /> Team Pipeline
          </button>
        )}
        {activeVertical === "sales" && showInMySidebar("offers") && (
          <button className={"nav-item " + (nav === "offers" ? "active" : "")} onClick={() => setNav("offers")}>
            <Handshake /> Offers
          </button>
        )}
        {activeVertical === "sales" && showInMySidebar("deals") && (
          <button className={"nav-item " + (nav === "deals" ? "active" : "")} onClick={() => setNav("deals")}>
            <DollarSign /> Deals
          </button>
        )}
        {activeVertical === "sales" && showInMySidebar("leaderboard") && (
          <button className={"nav-item " + (nav === "leaderboard" ? "active" : "")} onClick={() => setNav("leaderboard")}>
            <Trophy /> Leaderboard
          </button>
        )}
        {activeVertical === "rentals" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
          <>
            <button className={"nav-item " + (nav === "rentaloffers" ? "active" : "")} onClick={() => setNav("rentaloffers")}>
              <Handshake /> Rental Offers
            </button>
            <button className={"nav-item " + (nav === "rentaldeals" ? "active" : "")} onClick={() => setNav("rentaldeals")}>
              <DollarSign /> Rental Deals
            </button>
            <button className={"nav-item " + (nav === "rentalleaderboard" ? "active" : "")} onClick={() => setNav("rentalleaderboard")}>
              <Trophy /> Rental Leaderboard
            </button>
            <button className={"nav-item " + (nav === "rentalagents" ? "active" : "")} onClick={() => setNav("rentalagents")}>
              <Users /> Rental Agents
            </button>
          </>
        )}
        {showInMySidebar("listings") && (
          <button className={"nav-item " + (nav === "listings" ? "active" : "")} onClick={() => setNav("listings")}>
            <Building2 /> Listings
          </button>
        )}
        {showInMySidebar("contacts") && (
          <button className={"nav-item " + (nav === "contacts" ? "active" : "")} onClick={() => setNav("contacts")}>
            <ClipboardList /> Contacts
          </button>
        )}
        {showInMySidebar("marketing") && (
          <button className={"nav-item " + (nav === "marketing" ? "active" : "")} onClick={() => setNav("marketing")}>
            <Target /> Marketing
          </button>
        )}
        {activeVertical === "sales" && showInMySidebar("agents") && (
          <button className={"nav-item " + (nav === "agents" ? "active" : "")} onClick={() => setNav("agents")}>
            <Users /> Agents
          </button>
        )}
        {showInMySidebar("todos") && (
          <button className={"nav-item " + (nav === "todos" ? "active" : "")} onClick={() => setNav("todos")}>
            <ListChecks /> My To-Dos
            {myOpenTodosTotal > 0 && <span className="nav-count">{myOpenTodosTotal}</span>}
          </button>
        )}
        {showInMySidebar("tools") && (
          <button className={"nav-item " + (nav === "tools" ? "active" : "")} onClick={() => setNav("tools")}>
            <Calculator /> Tools
          </button>
        )}
        {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
          <button className={"nav-item " + (nav === "targets" ? "active" : "")} onClick={() => setNav("targets")}>
            <Target /> Targets
          </button>
        )}
        {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
          <button className={"nav-item " + (nav === "attorneybonds" ? "active" : "")} onClick={() => setNav("attorneybonds")}>
            <FileText /> Attorneys &amp; Bonds
          </button>
        )}
        {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
          <button className={"nav-item " + (nav === "mergerequests" ? "active" : "")} onClick={() => setNav("mergerequests")}>
            <UserPlus /> Merge Requests
            {mergeRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="nav-count">{mergeRequests.filter((r) => r.status === "pending").length}</span>
            )}
          </button>
        )}
        {currentRole === "masterAdmin" && (
          <button className={"nav-item " + (nav === "accesscontrol" ? "active" : "")} onClick={() => setNav("accesscontrol")}>
            <ShieldCheck /> Access Control
          </button>
        )}
        <div className="sidebar-foot">
          Listings synced from Propdata
          <div className="integration-pill">
            <Plug size={12} /> Mock data — connect live API
          </div>
          <div className="integration-pill">
            <CalendarPlus size={12} /> Outlook: one-click event, no sync yet
          </div>
          <div className="integration-pill">
            <MessageCircle size={12} /> WhatsApp: click-to-chat only
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="main" style={{ position: "relative" }}>
        <div className="topbar">
          <div>
            <div className="topbar-eyebrow">
              {nav === "dashboard" && "Overview"}
              {nav === "leads" && "Inbox"}
              {nav === "pipeline" && "Sales pipeline"}
              {nav === "canvassing" && "Door knocks"}
              {nav === "teampipeline" && "Benoni Office — by agent"}
              {nav === "offers" && "Negotiation stage — before a deal"}
              {nav === "deals" && "Deal ledger"}
              {nav === "leaderboard" && "Top Gross Commission earned"}
              {nav === "agentprofile" && OFFICE}
              {nav === "listings" && "Propdata feed"}
              {nav === "contacts" && "Landlords/Owners, Tenants, Buyers, Attorneys, Leads — all in one place"}
              {nav === "marketing" && "Office Manager, Master Admin & Marketing only"}
              {nav === "agents" && OFFICE}
              {nav === "todos" && "Personal — only visible to you"}
              {nav === "tools" && "Quick calculators — nothing here is saved"}
              {nav === "targets" && "Office Manager & Master Admin only"}
              {nav === "attorneybonds" && "Office Manager & Master Admin only"}
              {nav === "mergerequests" && "Office Manager & Master Admin only"}
              {nav === "accesscontrol" && "Master Admin only"}
              {nav === "rentaloffers" && "Rentals — before a signed lease"}
              {nav === "rentaldeals" && "Rentals — signed lease ledger"}
              {nav === "rentalleaderboard" && "Top Finder's Fee earned"}
              {nav === "rentalagents" && OFFICE}
            </div>
            <h1>
              {nav === "dashboard" && "Good morning"}
              {nav === "leads" && "Leads"}
              {nav === "pipeline" && "Pipeline"}
              {nav === "canvassing" && "Canvassing"}
              {nav === "teampipeline" && "Team Pipeline"}
              {nav === "offers" && "Offers"}
              {nav === "deals" && "Deals"}
              {nav === "leaderboard" && "Leaderboard"}
              {nav === "agentprofile" && (agentsList.find((a) => a.id === viewingAgentId)?.name || "Agent Profile")}
              {nav === "listings" && "Listings"}
              {nav === "contacts" && "Contacts"}
              {nav === "marketing" && "Marketing"}
              {nav === "agents" && "Agents"}
              {nav === "todos" && "My To-Dos"}
              {nav === "tools" && "Tools"}
              {nav === "targets" && "Targets"}
              {nav === "attorneybonds" && "Attorneys & Bonds"}
              {nav === "mergerequests" && "Merge Requests"}
              {nav === "accesscontrol" && "Access Control"}
              {nav === "rentaloffers" && "Rental Offers"}
              {nav === "rentaldeals" && "Rental Deals"}
              {nav === "rentalleaderboard" && "Rental Leaderboard"}
              {nav === "rentalagents" && "Rental Agents"}
            </h1>
          </div>
          <div className="topbar-controls">
            <div className="agent-switcher">
              <span>{ROLE_LABELS[currentRole] || currentRole}</span>
              <span className="locked-agent-name">{agentName(currentAgentId)}</span>
            </div>
            <button className="btn-ghost" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>

        <div className="content">
          {nav === "dashboard" && (
            <>
              {currentRole === "agent" && (() => {
                const progress = buildTargetProgress(currentAgentId, selectedYear);
                const periodTarget = periodMode === "year" ? progress.yearly : periodMode === "quarter" ? progress.quarterly : progress.monthly;
                const periodActual = periodMode === "year" ? progress.total : periodMode === "quarter" ? progress.byQuarter[selectedQuarter] : (progress.byMonth[selectedMonth] || 0);
                const periodLabel = periodMode === "year" ? selectedYear : periodMode === "quarter" ? "Q" + selectedQuarter + " " + selectedYear : selectedMonth + " " + selectedYear;
                const chartData = MONTH_ABBRS.map((m) => ({ month: m, Target: Math.round(progress.monthly), Actual: Math.round(progress.byMonth[m] || 0) }));
                return (
                  <>
                    <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                      <h3><Target size={15} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />My Target — {selectedYear}</h3>
                    </div>

                    {progress.yearly === 0 ? (
                      <div className="req-note" style={{ marginTop: 0, marginBottom: 20 }}>
                        <Info size={12} /> No target has been set for you yet for {selectedYear} — your Office Manager or Master Admin can set one under Targets.
                      </div>
                    ) : (
                      <>
                        <div className="stat-grid" style={{ marginBottom: 14 }}>
                          <div className="stat-card">
                            <div className="stat-label">Yearly Target</div>
                            <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(progress.yearly))}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">Achieved YTD</div>
                            <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(progress.total))}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">Still to do this year</div>
                            <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(progress.remaining))}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">{progress.paceDelta >= 0 ? "Ahead of pace by" : "Behind pace by"}</div>
                            <div className={"stat-value crm-mono " + (progress.paceDelta >= 0 ? "pace-ahead" : "pace-behind")} style={{ fontSize: 19 }}>
                              {fmtPrice(Math.round(Math.abs(progress.paceDelta)))}
                            </div>
                          </div>
                        </div>

                        <div className="target-progress-track" style={{ marginBottom: 6 }}>
                          <div
                            className="target-progress-fill"
                            style={{ width: Math.min(100, (progress.total / progress.yearly) * 100) + "%" }}
                          />
                        </div>
                        <div className="lead-sub" style={{ marginBottom: 18 }}>
                          {Math.round((progress.total / progress.yearly) * 100)}% of yearly target ·
                          {" "}avg {fmtPrice(Math.round(progress.avgNeededPerRemainingMonth))} needed per month for the rest of the year to hit it
                          {progress.monthsRemaining === 0 ? " (year complete)" : ""}
                        </div>

                        <PeriodPicker
                          mode={periodMode} setMode={setPeriodMode}
                          quarter={selectedQuarter} setQuarter={setSelectedQuarter}
                          month={selectedMonth} setMonth={setSelectedMonth}
                          year={selectedYear} setYear={setSelectedYear}
                          years={dealYears}
                        />

                        <div className="stat-grid" style={{ marginBottom: 20 }}>
                          <div className="stat-card">
                            <div className="stat-label">Target — {periodLabel}</div>
                            <div className="stat-value crm-mono" style={{ fontSize: 18 }}>{fmtPrice(Math.round(periodTarget))}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">Actual — {periodLabel}</div>
                            <div className="stat-value crm-mono" style={{ fontSize: 18 }}>{fmtPrice(Math.round(periodActual))}</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-label">{periodActual >= periodTarget ? "Over by" : "Short by"}</div>
                            <div className={"stat-value crm-mono " + (periodActual >= periodTarget ? "pace-ahead" : "pace-behind")} style={{ fontSize: 18 }}>
                              {fmtPrice(Math.round(Math.abs(periodActual - periodTarget)))}
                            </div>
                          </div>
                        </div>

                        <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
                          <div style={{ width: "100%", height: 220 }}>
                            <ResponsiveContainer>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "R" + (v / 1000).toFixed(0) + "k"} />
                                <Tooltip formatter={(v) => fmtPrice(Math.round(v))} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Target" fill="#C8C4B8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Actual" fill="var(--brass)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {(currentRole === "masterAdmin" || currentRole === "officeManager") && (() => {
                const KPI_METRICS = [
                  { key: "coldCalls", label: "Cold Calls", color: "var(--blue-ink)" },
                  { key: "doorKnocks", label: "Door Knocks", color: "var(--brass)" },
                  { key: "valuations", label: "Valuations", color: "#8B5FA8" },
                  { key: "listings", label: "Listings", color: "var(--sage)" },
                  { key: "viewings", label: "Viewings", color: "#E0935A" },
                  { key: "offers", label: "Offers", color: "var(--clay)" },
                  { key: "deals", label: "Deals", color: "var(--ink)" },
                ];
                const activeMetric = KPI_METRICS.find((m) => m.key === kpiChartMetric) || KPI_METRICS[0];
                const chartData = [...agentKpis.rows].sort((a, b) => b[activeMetric.key] - a[activeMetric.key]).filter((r) => r[activeMetric.key] > 0);
                return (
                  <>
                    <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                      <h3><ListChecks size={15} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />Agent KPIs</h3>
                    </div>
                    <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                      <Info size={12} /> Cold Calls, Door Knocks, and Listings are logged from the Canvassing board; Valuations from captured valuations; Viewings from booked-viewing notes on leads; Offers and Deals from when each was created.
                    </div>

                    <div className="kpi-period-bar">
                      <div className="view-toggle">
                        {["week", "month", "quarter", "year"].map((m) => (
                          <button
                            key={m}
                            className={"toggle-btn " + (kpiPeriodMode === m ? "active" : "")}
                            onClick={() => { setKpiPeriodMode(m); setKpiPeriodOffset(0); }}
                          >
                            {m === "week" ? "Weekly" : m === "month" ? "Monthly" : m === "quarter" ? "Quarterly" : "Yearly"}
                          </button>
                        ))}
                      </div>
                      <button className="stage-btn" onClick={() => setKpiPeriodOffset((o) => o - 1)}>&larr; Prev</button>
                      <div className="kpi-period-label">{kpiPeriodLabel}</div>
                      <button className="stage-btn" disabled={kpiPeriodOffset >= 0} onClick={() => setKpiPeriodOffset((o) => Math.min(0, o + 1))}>Next &rarr;</button>
                      {kpiPeriodOffset !== 0 && <button className="stage-btn active" onClick={() => setKpiPeriodOffset(0)}>Back to current</button>}
                    </div>

                    <div className="panel" style={{ overflowX: "auto", marginBottom: 16 }}>
                      <table className="pipeline-table">
                        <thead>
                          <tr>
                            <th>Agent</th>
                            {KPI_METRICS.map((m) => <th key={m.key} className="pt-count">{m.label}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {agentKpis.rows.map((r) => (
                            <tr key={r.agent.id}>
                              <td>
                                <div className="agent-link" style={{ cursor: "default" }}>
                                  <span className="agent-avatar-sm">{r.agent.initials}</span> {r.agent.name}
                                </div>
                              </td>
                              {KPI_METRICS.map((m) => <td key={m.key} className="crm-mono pt-count">{r[m.key]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="pt-footer">
                            <td>Office total</td>
                            {KPI_METRICS.map((m) => <td key={m.key} className="crm-mono pt-count">{agentKpis.teamTotals[m.key]}</td>)}
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16, marginBottom: 20 }}>
                      <div className="panel" style={{ padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <h3 className="crm-display" style={{ fontSize: 14, margin: 0 }}>{activeMetric.label} per agent</h3>
                          <select className="select" value={kpiChartMetric} onChange={(e) => setKpiChartMetric(e.target.value)}>
                            {KPI_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                          </select>
                        </div>
                        {chartData.length === 0 ? (
                          <div style={{ padding: 24, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing logged for this period yet.</div>
                        ) : (
                          <div style={{ width: "100%", height: 220 }}>
                            <ResponsiveContainer>
                              <BarChart data={chartData.map((r) => ({ name: r.agent.name, value: r[activeMetric.key] }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" name={activeMetric.label} fill={activeMetric.color} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      <div className="panel" style={{ padding: 14 }}>
                        <h3 className="crm-display" style={{ fontSize: 13, margin: "0 0 8px 0" }}>Leaderboard — {activeMetric.label}</h3>
                        {chartData.slice(0, 5).map((r, i) => (
                          <div key={r.agent.id} className="canvas-leader-row">
                            <span className="rank-badge" style={{ width: 22, height: 22, fontSize: 11 }}>{i + 1}</span>
                            <span className="agent-avatar-sm">{r.agent.initials}</span>
                            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{r.agent.name}</span>
                            <span className="crm-mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{r[activeMetric.key]}</span>
                          </div>
                        ))}
                        {chartData.length === 0 && <div className="lead-sub">Nothing logged yet.</div>}
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">New leads today</div>
                  <div className="stat-value">{stats.newToday}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active listings</div>
                  <div className="stat-value">{stats.active}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Under offer</div>
                  <div className="stat-value">{stats.underOffer}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Sold value (MTD)</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 20 }}>{fmtPrice(stats.soldValue)}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
                <div className="panel">
                  <div className="panel-head">
                    <h3>Recent leads</h3>
                    <button className="nav-item" style={{ color: "var(--brass)", width: "auto", fontSize: 12 }} onClick={() => setNav("leads")}>
                      View all <ChevronRight size={14} />
                    </button>
                  </div>
                  {filteredLeads.slice(0, 5).map((l) => (
                    <div key={l.id} className="lead-row" style={{ gridTemplateColumns: "1.5fr 1fr 1.5fr auto" }} onClick={() => openLead(l)}>
                      <div>
                        <div className="lead-name">{l.name}</div>
                        <div className="lead-sub">{fmtDate(l.date)}</div>
                      </div>
                      <span className={"badge " + SOURCES[l.source].cls}>{SOURCES[l.source].label}</span>
                      <div className="lead-sub">{l.listingAddress}</div>
                      <span className={"badge status-badge status-" + l.status.replace(" ", "")}>{l.status}</span>
                    </div>
                  ))}
                </div>

                <div className="panel">
                  <div className="panel-head"><h3>Leads by source</h3></div>
                  {Object.entries(sourceCounts).map(([src, count]) => (
                    <div className="source-row" key={src}>
                      <span className={"badge " + SOURCES[src].cls} style={{ width: 120, justifyContent: "flex-start" }}>{SOURCES[src].label}</span>
                      <div className="source-bar-track">
                        <div className="source-bar-fill" style={{ width: (count / maxSourceCount) * 100 + "%", background: "var(--brass)" }} />
                      </div>
                      <span className="crm-mono" style={{ fontSize: 12, width: 18, textAlign: "right" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {nav === "leads" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Importing your own spreadsheet of contacts? New ones get added straight away; if a contact matches someone already in the system under another agent, it's flagged for Office Manager or Master Admin to approve as a merge — nothing gets overwritten or lost either way.
              </div>
              <div className="filter-bar">
                <div className="search-wrap">
                  <Search />
                  <input className="search-input" placeholder="Search name or property..." value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <select className="select" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                  <option value="all">All sources</option>
                  {Object.keys(SOURCES).map((s) => <option key={s} value={s}>{SOURCES[s].label}</option>)}
                </select>
                <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All stages</option>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {currentRole !== "agent" && (
                  <select className="select" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
                    <option value="all">All agents</option>
                    {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
                <div style={{ flex: 1 }} />
                <label className="stage-btn active" style={{ cursor: "pointer" }}>
                  <Upload size={13} style={{ marginRight: 4 }} /> Import my contacts
                  <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleLeadsImport(e.target.files[0])} />
                </label>
              </div>
              {leadsImportSummary && (
                <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                  <Info size={12} />
                  {leadsImportSummary.error
                    ? "Couldn't read \u201c" + leadsImportSummary.fileName + "\u201d — check it's a valid CSV or XLSX export."
                    : "From " + leadsImportSummary.fileName + ": " + leadsImportSummary.added + " new contact" + (leadsImportSummary.added === 1 ? "" : "s") + " added"
                      + (leadsImportSummary.ownDuplicates > 0 ? " · " + leadsImportSummary.ownDuplicates + " already yours, skipped" : "")
                      + (leadsImportSummary.flaggedForMerge > 0 ? " · " + leadsImportSummary.flaggedForMerge + " flagged for merge approval (matched an existing contact under another agent)" : "")}
                </div>
              )}
              <div className="panel">
                {filteredLeads.length === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>
                    No leads match these filters. Try clearing search or source.
                  </div>
                )}
                {filteredLeads.map((l) => (
                  <div className="lead-row" key={l.id} onClick={() => openLead(l)}>
                    <div>
                      <div className="lead-name">{l.name}</div>
                      <div className="lead-sub">{l.phone}</div>
                    </div>
                    <span className={"badge " + SOURCES[l.source].cls}>{SOURCES[l.source].label}</span>
                    <div>
                      <div style={{ fontSize: 13 }}>{l.listingAddress}</div>
                      <div className="lead-sub crm-mono">{l.listingRef} · {fmtPrice(l.price)}</div>
                    </div>
                    <div className="lead-sub">{agentName(l.agent)}</div>
                    <div className="lead-sub">{fmtDate(l.date)}</div>
                    <span className={"badge status-badge status-" + l.status.replace(" ", "")}>{l.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {nav === "pipeline" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> {agentName(currentAgentId)}'s own pipeline — deal totals below reflect the period selected, lead stages below that are always current.
              </div>

              <PeriodPicker
                mode={periodMode} setMode={setPeriodMode}
                quarter={selectedQuarter} setQuarter={setSelectedQuarter}
                month={selectedMonth} setMonth={setSelectedMonth}
                year={selectedYear} setYear={setSelectedYear}
                years={dealYears}
              />

              <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-label">Confirmed Commission</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(conditionTotals.byAgent[currentAgentId]?.confirmed || 0))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Suspensive</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(conditionTotals.byAgent[currentAgentId]?.suspensive || 0))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Deals in Period</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{periodDeals.filter((d) => d.agent === currentAgentId).length}</div>
                </div>
                <div className="stat-card stat-card-fallen">
                  <div className="stat-label">Fallen Through</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(conditionTotals.byAgent[currentAgentId]?.fallenThrough || 0))}</div>
                </div>
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Lead stages</h3>
              </div>
              <div className="kanban">
                {STAGES.map((stage, i) => (
                  <div className="kanban-col" key={stage}>
                    <div className="kanban-eyebrow">{String(i + 1).padStart(2, "0")}</div>
                    <div className="kanban-title">{stage} ({scopedLeads.filter((l) => l.status === stage).length})</div>
                    {scopedLeads.filter((l) => l.status === stage).map((l) => (
                      <div className="kanban-card" key={l.id} onClick={() => openLead(l)}>
                        <div className="name">{l.name}</div>
                        <div className="addr">{l.listingAddress}</div>
                        <span className={"badge " + SOURCES[l.source].cls} style={{ marginTop: 6 }}>{SOURCES[l.source].label}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {nav === "canvassing" && (() => {
            const filteredCanvas = scopedDoorKnocks
              .filter((dk) => canvasShowArchived || !dk.archived)
              .filter((dk) => canvasStatusFilter === "all" || dk.status === canvasStatusFilter)
              .filter((dk) => {
                if (!canvasSearch.trim()) return true;
                const q = canvasSearch.toLowerCase();
                return (dk.address || "").toLowerCase().includes(q) || (dk.ownerName || "").toLowerCase().includes(q) || (dk.ownerPhone || "").includes(q);
              });
            return (
              <>
                <div className="panel canvas-intro">
                  <div>
                    <h3 className="crm-display" style={{ fontSize: 16, margin: 0 }}>Area Canvas</h3>
                    <div className="lead-sub">Import ownership records, request numbers, contact owners, and list buildings.</div>
                  </div>
                  <label className="stage-btn active" style={{ cursor: "pointer" }}>
                    <Upload size={13} style={{ marginRight: 4 }} /> Import CSV / XLSX
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleCanvasImport(e.target.files[0])} />
                  </label>
                </div>
                {canvasImportSummary && (
                  <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                    <Info size={12} />
                    {canvasImportSummary.error
                      ? "Couldn't read that file — check it's a valid CSV or XLSX export."
                      : "Imported " + canvasImportSummary.added + " new record" + (canvasImportSummary.added === 1 ? "" : "s") + (canvasImportSummary.skipped > 0 ? " · skipped " + canvasImportSummary.skipped + " duplicate" + (canvasImportSummary.skipped === 1 ? "" : "s") + " (matched by address or contact number)" : "")}
                  </div>
                )}

                <div className="filter-bar">
                  <div className="view-toggle">
                    <button className={"toggle-btn " + (canvassView === "board" ? "active" : "")} onClick={() => setCanvassView("board")}>
                      <Columns3 size={13} /> Board
                    </button>
                    <button className={"toggle-btn " + (canvassView === "map" ? "active" : "")} onClick={() => setCanvassView("map")}>
                      <MapIcon size={13} /> Map
                    </button>
                  </div>
                  <div className="search-wrap" style={{ maxWidth: 260 }}>
                    <Search />
                    <input className="search-input" placeholder="Address, owner, contact" value={canvasSearch} onChange={(e) => setCanvasSearch(e.target.value)} />
                  </div>
                  <select className="select" value={canvasStatusFilter} onChange={(e) => setCanvasStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {DK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <label className="dk-legend-item" style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={canvasShowArchived} onChange={(e) => setCanvasShowArchived(e.target.checked)} /> Show archived
                  </label>
                  <div style={{ flex: 1 }} />
                  <button className="stage-btn active" onClick={() => setAddCanvasOpen(true)}>+ Add Record</button>
                </div>

                {canvassView === "board" && (
                  <div className="canvas-board">
                    {DK_STATUSES.map((status) => {
                      const items = filteredCanvas.filter((dk) => dk.status === status);
                      const collapsed = !!collapsedCanvasCols[status];
                      return (
                        <div className="canvas-col" key={status}>
                          <div className="canvas-col-head">
                            <div>
                              <div className="canvas-col-title">{status}</div>
                              <div className="lead-sub">{DK_STATUS_SUBTITLE[status]}</div>
                            </div>
                            <span className="canvas-col-count">{items.length}</span>
                            <button className="stage-btn" onClick={() => setCollapsedCanvasCols((p) => ({ ...p, [status]: !p[status] }))}>
                              {collapsed ? "OPEN" : "CLOSE"}
                            </button>
                          </div>
                          {!collapsed && (
                            <div className="canvas-col-body">
                              {items.length === 0 && (
                                <div className="canvas-empty">
                                  <Inbox size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
                                  <div style={{ fontWeight: 700 }}>No {status.toLowerCase()} records</div>
                                  <div className="lead-sub">Records will appear here when they reach this step.</div>
                                </div>
                              )}
                              {items.map((dk) => (
                                <div className="canvas-card" key={dk.id}>
                                  <div className="canvas-card-addr">{dk.address}</div>
                                  {dk.erfRef && <div className="lead-sub">{dk.erfRef}</div>}
                                  <div className="canvas-card-owner">{dk.ownerName || dk.knownName || "Unknown owner"}</div>
                                  <span className={"badge " + DK_STATUS_CLASS[dk.status]} style={{ marginTop: 4 }}>{dk.status.toUpperCase()}</span>
                                  <div className="canvas-card-meta">
                                    <span>Broker: {agentName(dk.broker || dk.agent)}</span>
                                    {dk.erfSizeSqm ? <span>Erf: {dk.erfSizeSqm} sqm</span> : null}
                                  </div>
                                  <div className="canvas-card-meta">
                                    {dk.sellPrice ? <span>Marketing price: {fmtPrice(dk.sellPrice)}</span> : <span>No marketing price</span>}
                                    <span>{dk.ownerPhone || "No number"}</span>
                                  </div>
                                  <div className="lead-sub">{dk.emailContactDetails || "No email"}</div>
                                  {dk.marketingLink && (
                                    <a className="lead-sub" href={dk.marketingLink} target="_blank" rel="noreferrer" style={{ color: "var(--blue-ink)", textDecoration: "underline" }}>
                                      View current listing ↗
                                    </a>
                                  )}
                                  <div className="canvas-card-actions">
                                    {dk.ownerPhone ? (
                                      <a className="stage-btn" href={"https://wa.me/" + dk.ownerPhone.replace(/\D/g, "")} target="_blank" rel="noreferrer">
                                        <MessageCircle size={12} style={{ marginRight: 3 }} /> WhatsApp
                                      </a>
                                    ) : (
                                      <button className="stage-btn" disabled><MessageCircle size={12} style={{ marginRight: 3 }} /> No WhatsApp</button>
                                    )}
                                    {status === "Uncontacted" && !dk.ownerPhone && (
                                      <button className="stage-btn" onClick={() => requestNumber(dk)}>Request Number</button>
                                    )}
                                    {status === "Uncontacted" && dk.ownerPhone && (
                                      <button className="stage-btn active" onClick={() => markMadeContact(dk)}>Made Contact</button>
                                    )}
                                  </div>
                                  <div className="canvas-card-actions">
                                    <button className="stage-btn" onClick={() => logCanvassingActivity(dk, "Call")}><Phone size={12} style={{ marginRight: 3 }} /> Log Call</button>
                                    <button className="stage-btn" onClick={() => logCanvassingActivity(dk, "Door Knock")}><Compass size={12} style={{ marginRight: 3 }} /> Log Door Knock</button>
                                  </div>
                                  <div className="canvas-card-actions">
                                    <button className="stage-btn" onClick={() => { setEditCanvasId(dk.id); setCanvasFormDraft({ address: dk.address, suburb: dk.suburb, sellPrice: dk.sellPrice, marketingLink: dk.marketingLink || "", ownerName: dk.ownerName, ownerPhone: dk.ownerPhone, emailContactDetails: dk.emailContactDetails, followUpDate: dk.followUpDate ? new Date(dk.followUpDate).toISOString().slice(0, 10) : "" }); setAddCanvasOpen(true); }}>Edit</button>
                                    <button className="stage-btn" onClick={() => openDK(dk)}>Note</button>
                                    {dk.archived ? (
                                      <button className="stage-btn" onClick={() => unarchiveDK(dk)}>Unarchive</button>
                                    ) : (
                                      <button className="stage-btn danger-text" onClick={() => archiveDK(dk)}>Archive</button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {canvassView === "map" && (
                  <>
                    <div className="dk-legend" style={{ marginBottom: 10 }}>
                      {DK_STATUSES.map((s) => (
                        <span key={s} className="dk-legend-item"><span className={"dk-dot-swatch " + DK_STATUS_CLASS[s]} />{s}</span>
                      ))}
                    </div>
                    <div className="dk-map">
                      <svg className="dk-map-bg" viewBox="0 0 600 380" preserveAspectRatio="none">
                        <rect width="600" height="380" fill="#EDE8DC" />
                        {[60, 160, 260, 360, 460, 560].map((x) => <line key={"v"+x} x1={x} y1="0" x2={x} y2="380" stroke="#DCD5C4" strokeWidth="10" />)}
                        {[50, 130, 210, 290, 370].map((y) => <line key={"h"+y} x1="0" y1={y} x2="600" y2={y} stroke="#DCD5C4" strokeWidth="10" />)}
                      </svg>
                      {filteredCanvas.map((dk) => (
                        <button
                          key={dk.id}
                          className={"dk-pin " + DK_STATUS_CLASS[dk.status]}
                          style={{ left: dk.x + "%", top: dk.y + "%" }}
                          onMouseEnter={() => setHoveredDK(dk.id)}
                          onMouseLeave={() => setHoveredDK((h) => (h === dk.id ? null : h))}
                          onClick={() => openDK(dk)}
                        >
                          <MapPin size={14} />
                          {hoveredDK === dk.id && (
                            <div className="dk-tooltip">
                              <div className="dk-tooltip-addr">{dk.address}</div>
                              <div className="dk-tooltip-row">{dk.ownerName} · knocked {fmtDate(dk.date)}</div>
                              <div className="dk-tooltip-row">"{dk.notes[dk.notes.length - 1]?.text}"</div>
                              <div className="dk-tooltip-row"><span className={"badge " + DK_STATUS_CLASS[dk.status]}>{dk.status}</span></div>
                              <div className="dk-tooltip-row">Follow up: {fmtDate(dk.followUpDate)}</div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {nav === "teampipeline" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <Info size={12} /> {OFFICE} — click an agent's name to see their leads. Pipeline values are current (excludes Sold/Lost); Commission Due reflects the period selected below, using each deal's own tier (Yellow 25% / Blue 35% / Silver 40% / Gold 45%).
              </div>

              <PeriodPicker
                mode={periodMode} setMode={setPeriodMode}
                quarter={selectedQuarter} setQuarter={setSelectedQuarter}
                month={selectedMonth} setMonth={setSelectedMonth}
                year={selectedYear} setYear={setSelectedYear}
                years={dealYears}
              />
              <div className="donut-row">
                {renderDonutCard("Broker Share", brokerShareData)}
                {renderDonutCard("Generated In", generatedInData)}
                {renderDonutCard("Deal Status", dealStatusDonutData)}
              </div>

              <div className="panel" style={{ padding: 16, marginBottom: 18 }}>
                <h3 className="crm-display" style={{ fontSize: 15, margin: "0 0 12px 0" }}>Team Target</h3>
                <div className="lead-sub" style={{ marginBottom: 10 }}>
                  Totalled from every agent's own target for {periodMode === "year" ? selectedYear : periodMode === "quarter" ? "Q" + selectedQuarter + " " + selectedYear : selectedMonth + " " + selectedYear} — set individually under Targets.
                </div>
                {teamTargetForPeriod === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No agent targets set for this period yet.</div>
                ) : (
                  <>
                    <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 10 }}>
                      <div className="stat-card">
                        <div className="stat-label">Team Target</div>
                        <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 17 }}>{fmtPrice(Math.round(teamTargetForPeriod))}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Team Achieved</div>
                        <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 17 }}>{fmtPrice(Math.round(conditionTotals.teamConfirmed))}</div>
                      </div>
                    </div>
                    <div className="target-progress-track">
                      <div className="target-progress-fill" style={{ width: Math.min(100, (conditionTotals.teamConfirmed / teamTargetForPeriod) * 100) + "%" }} />
                    </div>
                    <div className="lead-sub" style={{ marginTop: 6 }}>
                      {Math.round((conditionTotals.teamConfirmed / teamTargetForPeriod) * 100)}% of team target reached
                    </div>
                  </>
                )}
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Total NETT to Kingstons — by Tier</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> What's left after marketing, listing, and the agent's tier share are paid out on each deal. Fallen Through deals are excluded, same as the rest of the pipeline.
              </div>
              <div className="stat-grid" style={{ marginBottom: 18 }}>
                {DEAL_STATUSES.map((tier) => (
                  <div className="stat-card" key={tier}>
                    <div className="stat-label">{tier} tier ({Math.round((COMMISSION_FORMULA[tier]?.agentSharePct || 0) * 100)}% to agent)</div>
                    <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 18 }}>{fmtPrice(Math.round(nettToKingstonsByTier.byTier[tier] || 0))}</div>
                  </div>
                ))}
                <div className="stat-card" style={{ borderColor: "var(--brass)" }}>
                  <div className="stat-label">Total NETT to Kingstons</div>
                  <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 18 }}>{fmtPrice(Math.round(nettToKingstonsByTier.total))}</div>
                </div>
              </div>

              <div className="stat-grid" style={{ marginBottom: 18 }}>
                <div className="stat-card">
                  <div className="stat-label">Team Total Confirmed Commission</div>
                  <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 20 }}>{fmtPrice(Math.round(conditionTotals.teamConfirmed))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Team Total Suspensive</div>
                  <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 20 }}>{fmtPrice(Math.round(conditionTotals.teamSuspensive))}</div>
                </div>
                <div className="stat-card stat-card-fallen">
                  <div className="stat-label">Team Total Fallen Through (excluded from pipeline)</div>
                  <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 20 }}>{fmtPrice(Math.round(conditionTotals.teamFallenThrough))}</div>
                </div>
              </div>

              <div className="panel" style={{ overflowX: "auto", marginBottom: 24 }}>
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      {STAGES.map((s) => <th key={s}>{s}</th>)}
                      <th>Active</th>
                      <th>Pipeline value</th>
                      <th>Win rate</th>
                      <th>Confirmed Commission</th>
                      <th>Suspensive</th>
                      <th>Fallen Through</th>
                      <th>Commission Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPipeline.map((row) => (
                      <tr key={row.agent.id}>
                        <td>
                          <button
                            className="agent-link"
                            onClick={() => { setFilterAgent(row.agent.id); setFilterStatus("all"); setNav("leads"); }}
                          >
                            <span className="agent-avatar-sm">{row.agent.initials}</span> {row.agent.name}
                          </button>
                        </td>
                        {STAGES.map((s) => (
                          <td key={s} className="pt-count">{row.byStage[s] > 0 ? row.byStage[s] : <span className="pt-zero">—</span>}</td>
                        ))}
                        <td className="pt-count">{row.activeCount}</td>
                        <td className="crm-mono pt-count">{fmtPrice(row.pipelineValue)}</td>
                        <td className="pt-count">{row.winRate === null ? <span className="pt-zero">—</span> : row.winRate + "%"}</td>
                        <td className="crm-mono pt-count computed-cell cond-confirmed">{fmtPrice(Math.round(conditionTotals.byAgent[row.agent.id]?.confirmed || 0))}</td>
                        <td className="crm-mono pt-count computed-cell cond-suspensive">{fmtPrice(Math.round(conditionTotals.byAgent[row.agent.id]?.suspensive || 0))}</td>
                        <td className="crm-mono pt-count computed-cell cond-fallen">{fmtPrice(Math.round(conditionTotals.byAgent[row.agent.id]?.fallenThrough || 0))}</td>
                        <td className="crm-mono pt-count computed-cell">{fmtPrice(Math.round(agentCommissionTotals[row.agent.id] || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Office total</td>
                      {STAGES.map((s) => (
                        <td key={s} className="pt-count">{agentPipeline.reduce((sum, r) => sum + r.byStage[s], 0)}</td>
                      ))}
                      <td className="pt-count">{agentPipeline.reduce((sum, r) => sum + r.activeCount, 0)}</td>
                      <td className="crm-mono pt-count">{fmtPrice(agentPipeline.reduce((sum, r) => sum + r.pipelineValue, 0))}</td>
                      <td></td>
                      <td className={"crm-mono pt-count " + (currentRole === "agent" ? "amount-blurred" : "")}>{fmtPrice(Math.round(conditionTotals.teamConfirmed))}</td>
                      <td className={"crm-mono pt-count " + (currentRole === "agent" ? "amount-blurred" : "")}>{fmtPrice(Math.round(conditionTotals.teamSuspensive))}</td>
                      <td className={"crm-mono pt-count " + (currentRole === "agent" ? "amount-blurred" : "")}>{fmtPrice(Math.round(conditionTotals.teamFallenThrough))}</td>
                      <td className="crm-mono pt-count">{fmtPrice(Math.round(Object.values(agentCommissionTotals).reduce((s, v) => s + v, 0)))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Monthly revenue — team &amp; broker</h3>
              </div>
              <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "R" + (v / 1000).toFixed(0) + "k"} />
                      <Tooltip formatter={(v) => fmtPrice(Math.round(v))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="teamGross" name="Team Gross Commission" fill="var(--brass)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="brokerNett" name="Broker Nett (KRE)" fill="var(--ink)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="pipeline-table">
                  <thead>
                    <tr><th>Month</th><th>Team Gross Commission</th><th>Broker Nett (KRE)</th></tr>
                  </thead>
                  <tbody>
                    {monthlyRevenue.map((m) => (
                      <tr key={m.month}>
                        <td>{m.month}</td>
                        <td className="crm-mono pt-count">{fmtPrice(Math.round(m.teamGross))}</td>
                        <td className="crm-mono pt-count">{fmtPrice(Math.round(m.brokerNett))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="crm-mono pt-count">{fmtPrice(Math.round(monthlyRevenue.reduce((s, m) => s + m.teamGross, 0)))}</td>
                      <td className="crm-mono pt-count">{fmtPrice(Math.round(monthlyRevenue.reduce((s, m) => s + m.brokerNett, 0)))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Above the Line — Registrations &amp; Forecast</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <Info size={12} /> Based on Confirmed-group deals (Above the Line / Bond Approved / Cash Paid). Once "Registered" is ticked on a deal's transfer checklist, it moves here automatically under its real registration month — even if that's earlier or later than the original Exp Reg Date.
              </div>

              <div className="stat-grid" style={{ marginBottom: 18 }}>
                <div className="stat-card">
                  <div className="stat-label">Registered ({registrationBreakdown.registeredCount})</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 20 }}>{fmtPrice(Math.round(registrationBreakdown.registeredValue))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Still to Register ({registrationBreakdown.stillCount})</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 20 }}>{fmtPrice(Math.round(registrationBreakdown.stillValue))}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                    <h3>Registered by month (actual)</h3>
                  </div>
                  <div className="panel" style={{ overflowX: "auto" }}>
                    <table className="pipeline-table">
                      <thead><tr><th>Month</th><th>Deals</th><th>Value</th></tr></thead>
                      <tbody>
                        {registrationBreakdown.registeredByMonth.length === 0 && (
                          <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--slate)", padding: 16 }}>Nothing registered yet.</td></tr>
                        )}
                        {registrationBreakdown.registeredByMonth.map((m) => (
                          <tr key={m.month}>
                            <td>{m.month}</td>
                            <td className="pt-count">{m.count}</td>
                            <td className="crm-mono pt-count">{fmtPrice(Math.round(m.value))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                    <h3>Forecast — expected by month</h3>
                  </div>
                  <div className="panel" style={{ overflowX: "auto" }}>
                    <table className="pipeline-table">
                      <thead><tr><th>Month</th><th>Deals</th><th>Value</th></tr></thead>
                      <tbody>
                        {registrationBreakdown.forecastByMonth.length === 0 && (
                          <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--slate)", padding: 16 }}>Nothing outstanding.</td></tr>
                        )}
                        {registrationBreakdown.forecastByMonth.map((m) => (
                          <tr key={m.month}>
                            <td>{m.month}</td>
                            <td className="pt-count">{m.count}</td>
                            <td className="crm-mono pt-count">{fmtPrice(Math.round(m.value))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {nav === "leaderboard" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <Info size={12} />
                {currentRole === "agent"
                  ? " Ranked by Total Confirmed Commission (ex VAT). You can see everyone's rank, but commission amounts are blurred for anyone except you."
                  : " Ranked by Total Confirmed Commission (ex VAT) as selling agent. Click an agent to open their profile."}
              </div>

              <PeriodPicker
                mode={periodMode} setMode={setPeriodMode}
                quarter={selectedQuarter} setQuarter={setSelectedQuarter}
                month={selectedMonth} setMonth={setSelectedMonth}
                year={selectedYear} setYear={setSelectedYear}
                years={dealYears}
              />

              <div className="stat-grid" style={{ marginBottom: 18 }}>
                <div className="stat-card">
                  <div className="stat-label">Team Total Confirmed Commission</div>
                  <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 20 }}>{fmtPrice(Math.round(conditionTotals.teamConfirmed))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Team Total Suspensive</div>
                  <div className={"stat-value crm-mono " + (currentRole === "agent" ? "amount-blurred" : "")} style={{ fontSize: 20 }}>{fmtPrice(Math.round(conditionTotals.teamSuspensive))}</div>
                </div>
              </div>

              <div className="panel">
                {leaderboard.map((row, i) => {
                  const clickable = currentRole !== "agent" || row.agent.id === currentAgentId;
                  const shouldBlur = currentRole === "agent" && row.agent.id !== currentAgentId;
                  return (
                    <button
                      className={"leaderboard-row " + (i < 3 ? "rank-" + (i + 1) : "") + (clickable ? "" : " leaderboard-row-locked")}
                      key={row.agent.id}
                      onClick={() => clickable && openAgentProfile(row.agent.id)}
                    >
                      <div className="rank-badge">{i < 3 ? <Trophy size={16} /> : i + 1}</div>
                      <span className="agent-avatar-sm" style={{ width: 30, height: 30, fontSize: 11 }}>{row.agent.initials}</span>
                      <div style={{ flex: "0 1 190px", textAlign: "left" }}>
                        <div className="lead-name">{row.agent.name}{row.agent.id === currentAgentId && currentRole === "agent" ? " (you)" : ""}</div>
                        <div className="lead-sub">{row.deals} deal{row.deals === 1 ? "" : "s"}</div>
                      </div>
                      <div style={{ flex: 1, padding: "0 20px" }}>
                        {(() => {
                          const progress = buildTargetProgress(row.agent.id, selectedYear);
                          if (!progress.yearly) {
                            return <div className="lead-sub" style={{ textAlign: "center" }}>No target set for {selectedYear}</div>;
                          }
                          const pct = Math.min(100, (progress.total / progress.yearly) * 100);
                          return (
                            <>
                              <div className="target-progress-track" style={{ height: 8 }}>
                                <div className="target-progress-fill" style={{ width: pct + "%" }} />
                              </div>
                              <div className={"lead-sub " + (shouldBlur ? "amount-blurred" : "")} style={{ marginTop: 5, textAlign: "center" }}>
                                {fmtPrice(Math.round(progress.total))} of {fmtPrice(Math.round(progress.yearly))} target · {Math.round(pct)}%
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className={"crm-mono leaderboard-amount " + (shouldBlur ? "amount-blurred" : "")}>{fmtPrice(Math.round(row.gross))}</div>
                        {row.suspensive > 0 && (
                          <div className={"lead-sub crm-mono " + (shouldBlur ? "amount-blurred" : "")}>Suspensive: {fmtPrice(Math.round(row.suspensive))}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {nav === "agentprofile" && agentProfileData && (
            <>
              <button className="stage-btn" style={{ marginBottom: 16 }} onClick={() => setNav("leaderboard")}>
                <ChevronRight size={13} style={{ transform: "rotate(180deg)", marginRight: 4 }} /> Back to Leaderboard
              </button>

              <div className="profile-header">
                <span className="agent-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{agentProfileData.agent.initials}</span>
                <div>
                  <div className="crm-display" style={{ fontSize: 20, fontWeight: 700 }}>{agentProfileData.agent.name}</div>
                  <div className="lead-sub">{OFFICE}</div>
                </div>
                {currentRole === "masterAdmin" && (
                  <div style={{ marginLeft: "auto" }}>
                    <div className="field-label" style={{ marginTop: 0, textAlign: "right" }}>Status</div>
                    <select
                      className={"cell-input deal-status-select " + DEAL_STATUS_CLASS[agentProfileData.agent.tier || "Yellow"]}
                      value={agentProfileData.agent.tier || "Yellow"}
                      onChange={(e) => handleSetAgentTier(agentProfileData.agent.id, e.target.value)}
                    >
                      {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="panel-head" style={{ padding: "16px 0 8px 0", border: "none" }}>
                <h3>Contact details</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 10 }}>
                <Info size={12} /> Used to fill in the Offer to Purchase emails sent to buyers and sellers.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div>
                  <div className="field-label" style={{ marginTop: 0 }}>Cell number</div>
                  <input
                    type="text" className="req-input" placeholder="082 000 0000"
                    value={(agentContacts[agentProfileData.agent.id] || {}).cell || ""}
                    onChange={(e) => setAgentContactField(agentProfileData.agent.id, "cell", e.target.value)}
                  />
                </div>
                <div>
                  <div className="field-label" style={{ marginTop: 0 }}>Email address</div>
                  <input
                    type="email" className="req-input" placeholder="agent@kingstons.co.za"
                    value={(agentContacts[agentProfileData.agent.id] || {}).email || ""}
                    onChange={(e) => setAgentContactField(agentProfileData.agent.id, "email", e.target.value)}
                  />
                </div>
              </div>

              <div className="panel-head" style={{ padding: "8px 0 8px 0", border: "none" }}>
                <h3>Period</h3>
              </div>
              <PeriodPicker
                mode={periodMode} setMode={setPeriodMode}
                quarter={selectedQuarter} setQuarter={setSelectedQuarter}
                month={selectedMonth} setMonth={setSelectedMonth}
                year={selectedYear} setYear={setSelectedYear}
                years={dealYears}
              />

              <div className="stat-grid" style={{ marginTop: 18 }}>
                <div className="stat-card">
                  <div className="stat-label">Active leads</div>
                  <div className="stat-value">{agentProfileData.pipelineRow ? agentProfileData.pipelineRow.activeCount : 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Win rate</div>
                  <div className="stat-value">{agentProfileData.pipelineRow?.winRate === null || agentProfileData.pipelineRow?.winRate === undefined ? "—" : agentProfileData.pipelineRow.winRate + "%"}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Confirmed Commission ({periodMode === "year" ? selectedYear : periodMode === "month" ? selectedMonth + " " + selectedYear : "Q" + selectedQuarter + " " + selectedYear})</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 18 }}>{fmtPrice(Math.round(agentProfileData.grossFromSales))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Suspensive</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 18 }}>{fmtPrice(Math.round(agentProfileData.suspensive))}</div>
                </div>
                <div className="stat-card stat-card-fallen">
                  <div className="stat-label">Fallen Through</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 18 }}>{fmtPrice(Math.round(agentProfileData.fallenThrough))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Commission Due (incl. listing/splits)</div>
                  <div className="stat-value crm-mono" style={{ fontSize: 18 }}>{fmtPrice(Math.round(agentProfileData.periodCommission))}</div>
                </div>
              </div>

              <div className="panel-head" style={{ padding: "18px 0 10px 0", border: "none" }}>
                <h3>Goals by quarter — {selectedYear}</h3>
              </div>
              {!agentProfileGoals?.yearly ? (
                <div className="panel" style={{ marginBottom: 20 }}>
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>
                    No yearly target set for {selectedYear} yet — set one under <button className="link-btn" onClick={() => setNav("targets")}>Targets</button>.
                  </div>
                </div>
              ) : (
                <div className="panel" style={{ padding: 18, marginBottom: 20 }}>
                  <div className="goal-stat-row">
                    <div>
                      <div className="stat-label">Yearly target</div>
                      <div className="stat-value crm-mono" style={{ fontSize: 17 }}>{fmtPrice(Math.round(agentProfileGoals.yearly))}</div>
                    </div>
                    <div>
                      <div className="stat-label">Achieved so far</div>
                      <div className="stat-value crm-mono" style={{ fontSize: 17, color: "var(--sage)" }}>{fmtPrice(Math.round(agentProfileGoals.total))}</div>
                    </div>
                    <div>
                      <div className="stat-label">Still needed</div>
                      <div className="stat-value crm-mono" style={{ fontSize: 17, color: agentProfileGoals.remaining > 0 ? "var(--clay)" : "var(--sage)" }}>
                        {fmtPrice(Math.round(agentProfileGoals.remaining))}
                      </div>
                    </div>
                    <div>
                      <div className="stat-label">Pace vs. expected</div>
                      <div className="stat-value crm-mono" style={{ fontSize: 17, color: agentProfileGoals.paceDelta >= 0 ? "var(--sage)" : "var(--clay)" }}>
                        {agentProfileGoals.paceDelta >= 0 ? "+" : ""}{fmtPrice(Math.round(agentProfileGoals.paceDelta))}
                      </div>
                    </div>
                  </div>
                  <div style={{ width: "100%", height: 200, marginTop: 8 }}>
                    <ResponsiveContainer>
                      <BarChart data={agentProfileGoals.chartData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: "var(--slate)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--slate)" }} axisLine={false} tickLine={false} tickFormatter={(v) => "R" + (v / 1000).toFixed(0) + "k"} />
                        <Tooltip formatter={(v) => fmtPrice(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="target" name="Target" fill="#E7E8EC" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual" fill="var(--sage)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="panel-head" style={{ padding: "18px 0 10px 0", border: "none" }}>
                <h3>Pipeline by stage</h3>
              </div>
              <div className="panel" style={{ overflowX: "auto", marginBottom: 20 }}>
                <table className="pipeline-table">
                  <thead><tr>{STAGES.map((s) => <th key={s}>{s}</th>)}</tr></thead>
                  <tbody>
                    <tr>
                      {STAGES.map((s) => (
                        <td key={s} className="pt-count">{agentProfileData.pipelineRow?.byStage[s] > 0 ? agentProfileData.pipelineRow.byStage[s] : <span className="pt-zero">—</span>}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>
                  Deals (as selling, listing, or shared agent) —{" "}
                  {periodMode === "year" ? selectedYear : periodMode === "month" ? selectedMonth + " " + selectedYear : "Q" + selectedQuarter + " " + selectedYear}
                </h3>
                <button
                  className="stage-btn active"
                  onClick={() => { addManualDeal(agentProfileData.agent.id); setNav("deals"); }}
                >
                  + Add deal for {agentProfileData.agent.name}
                </button>
              </div>
              {currentRole === "masterAdmin" && (
                <div className="req-note" style={{ marginTop: 0, marginBottom: 10 }}>
                  <Info size={12} /> Click "Details" on any deal below to edit every field and change its stage — same as the main Deals page.
                </div>
              )}
              <div className="panel">
                {agentProfileData.myDeals.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>
                    No deals for {agentProfileData.agent.name} in {periodMode === "year" ? selectedYear : periodMode === "month" ? selectedMonth + " " + selectedYear : "Q" + selectedQuarter + " " + selectedYear}.
                  </div>
                )}
                {agentProfileData.myDeals.map((d) => {
                  const isPrimary = d.agent === viewingAgentId;
                  const isListingOnly = !isPrimary && d.listingAgent === viewingAgentId;
                  const isShared = !isPrimary && !isListingOnly && d.sharedWithAgent === viewingAgentId;
                  const myShare = splitGrossAmount(d, Number(d.confirmedCommission) || 0)
                    .find((s) => s.agentId === viewingAgentId);
                  const roleLabel = isPrimary ? "Selling agent (controls this deal)" : isListingOnly ? "Listing agent" : "Shared — view only";
                  return (
                    <div className={"lead-row " + (isShared ? "deal-row-readonly" : "")} key={d.id} style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr 1.3fr 0.7fr" }}>
                      <div>
                        <div className="lead-name">{d.property}</div>
                        <div className="lead-sub">{d.suburb} · {d.month}</div>
                      </div>
                      <div className="lead-sub">
                        {roleLabel}
                        {isShared && <div>Controlled by {agentName(d.agent)}</div>}
                      </div>
                      <div className="crm-mono lead-sub">
                        {fmtPrice(Math.round(myShare ? myShare.amount : (d.confirmedCommission || 0)))}
                        {isShared && <div className="lead-sub">of {fmtPrice(d.confirmedCommission || 0)} total</div>}
                      </div>
                      {isShared ? (
                        <span className={"badge " + CONDITION_CLASS[CONDITION_GROUP[d.conditionStatus]]}>{d.conditionStatus}</span>
                      ) : (
                        <select
                          className={"cell-input cond-select " + CONDITION_CLASS[CONDITION_GROUP[d.conditionStatus]]}
                          value={d.conditionStatus}
                          onChange={(e) => updateDeal(d.id, "conditionStatus", e.target.value)}
                        >
                          {CONDITION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                      <button className="stage-btn" onClick={() => setDealDrawerId(d.id)}>Details</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {nav === "rentaloffers" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Handshake size={12} /> Rental offers sit here until the landlord accepts. Mark "Accepted" once the landlord's on board and it moves straight into Rental Deals.
              </div>
              <div className="filter-bar">
                <div style={{ flex: 1 }} />
                <button className="stage-btn active" onClick={() => addManualRentalOffer()}>+ Add rental offer</button>
              </div>
              {rentalOffers.length === 0 ? (
                <div className="panel">
                  <div style={{ padding: 24, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No rental offers yet.</div>
                </div>
              ) : (
                <div className="panel" style={{ overflowX: "auto" }}>
                  <table className="deal-table offer-table">
                    <thead>
                      <tr>
                        <th className="col-sticky col-sticky-1">Agent</th>
                        <th className="col-sticky col-sticky-2">Property</th>
                        <th>Month</th>
                        <th>Status</th>
                        <th>Suburb</th>
                        <th>Landlord</th>
                        <th>Tenant</th>
                        <th>Monthly Rental</th>
                        <th>Finder's Fee</th>
                        <th>Managed</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentalOffers.map((o) => (
                        <tr key={o.id}>
                          <td className="col-sticky col-sticky-1">
                            <select className="cell-input" value={o.agent || ""} onChange={(e) => updateRentalOffer(o.id, "agent", e.target.value)}>
                              {!rentalAgentsList.some((a) => a.id === o.agent) && <option value="">— select agent —</option>}
                              {rentalAgentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </td>
                          <td className="col-sticky col-sticky-2">
                            <AddressAutocompleteInput
                              className="cell-input" disabled={!!o.dealId} value={o.property}
                              onChange={(v) => updateRentalOffer(o.id, "property", v)}
                              onSelectPlace={({ address, suburb }) => { updateRentalOffer(o.id, "property", address); if (suburb) updateRentalOffer(o.id, "suburb", suburb); }}
                            />
                          </td>
                          <td>
                            <select className="cell-input" disabled={!!o.dealId} value={o.month || ""} onChange={(e) => updateRentalOffer(o.id, "month", e.target.value)}>
                              <option value="">— select —</option>
                              {MONTH_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </td>
                          <td>
                            {o.dealId ? (
                              <button className="badge cond-confirmed offer-converted-btn" onClick={() => setNav("rentaldeals")}>Converted → Deal</button>
                            ) : (
                              <select
                                className={"cell-input offer-status-select " + (o.status === "Yes" ? "offer-yes" : o.status === "No" ? "offer-no" : "offer-pending")}
                                value={o.status} onChange={(e) => setRentalOfferStatus(o.id, e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Yes">Accepted by Landlord</option>
                                <option value="No">No Deal</option>
                              </select>
                            )}
                          </td>
                          <td><input type="text" className="cell-input" disabled={!!o.dealId} value={o.suburb} onChange={(e) => updateRentalOffer(o.id, "suburb", e.target.value)} /></td>
                          <td>
                            <ContactPicker
                              roleLabel="Landlord" nameValue={o.landlordName} contactId={o.landlordContactId} contacts={manualContacts} disabled={!!o.dealId}
                              onChangeName={(v) => updateRentalOffer(o.id, "landlordName", v)}
                              onLink={(c) => { updateRentalOffer(o.id, "landlordName", c.name); updateRentalOffer(o.id, "landlordContactId", c.id); }}
                              onUnlink={() => updateRentalOffer(o.id, "landlordContactId", "")}
                              onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                            />
                          </td>
                          <td>
                            <ContactPicker
                              roleLabel="Tenant" nameValue={o.tenantName} contactId={o.tenantContactId} contacts={manualContacts} disabled={!!o.dealId}
                              onChangeName={(v) => updateRentalOffer(o.id, "tenantName", v)}
                              onLink={(c) => { updateRentalOffer(o.id, "tenantName", c.name); updateRentalOffer(o.id, "tenantContactId", c.id); }}
                              onUnlink={() => updateRentalOffer(o.id, "tenantContactId", "")}
                              onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                            />
                          </td>
                          <td>
                            <div className="req-input-wrap crm-mono" style={{ marginTop: 0 }}>
                              <span>R</span><MoneyInput className="req-input" disabled={!!o.dealId} value={o.monthlyRental} onChange={(e) => updateRentalOffer(o.id, "monthlyRental", e.target.value)} />
                            </div>
                          </td>
                          <td>
                            <div className="req-input-wrap crm-mono" style={{ marginTop: 0 }}>
                              <span>R</span><MoneyInput className="req-input" disabled={!!o.dealId} value={o.findersFee} onChange={(e) => updateRentalOffer(o.id, "findersFee", e.target.value)} />
                            </div>
                          </td>
                          <td>
                            <label className="req-checkbox" style={{ marginTop: 0 }}>
                              <input type="checkbox" disabled={!!o.dealId} checked={!!o.managed} onChange={(e) => updateRentalOffer(o.id, "managed", e.target.checked)} />
                              {o.managed ? "Managed" : "Unmanaged"}
                            </label>
                          </td>
                          <td><button className="row-remove" onClick={() => removeRentalOffer(o.id)}><X size={13} /></button></td>
                          <td><button className="stage-btn" onClick={() => setRentalOfferDrawerId(o.id)}>Expand <ChevronRight size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {nav === "rentaldeals" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Rental deals are created automatically once an offer is accepted by the landlord.
              </div>
              {RENTAL_DEAL_STATUSES.map((status) => {
                const list = rentalDeals.filter((d) => d.status === status);
                return (
                  <React.Fragment key={status}>
                    <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                      <h3>{status} ({list.length})</h3>
                    </div>
                    {list.length === 0 ? (
                      <div className="panel" style={{ marginBottom: 24 }}>
                        <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing here yet.</div>
                      </div>
                    ) : (
                      <div className="panel simple-deal-list" style={{ marginBottom: 24 }}>
                        {list.map((d) => {
                          const pastMoveIn = d.moveInDate && new Date(d.moveInDate) < new Date();
                          return (
                            <div className="simple-deal-row" key={d.id} style={{ gridTemplateColumns: "minmax(200px,1.4fr) minmax(120px,0.8fr) minmax(120px,0.8fr) minmax(120px,0.8fr) minmax(220px,auto)" }}>
                              <div className="simple-deal-main">
                                <div className="lead-name">{d.property || "Untitled rental"}</div>
                                <div className="lead-sub">{d.suburb || "—"} · {d.month || "No month"} · {rentalAgentsList.find((a) => a.id === d.agent)?.name || "Unassigned"}</div>
                              </div>
                              <div className="simple-deal-money">
                                <div className="crm-mono">{fmtPrice(d.monthlyRental || 0)}</div>
                                <div className="lead-sub">Monthly rental</div>
                              </div>
                              <div className="simple-deal-money">
                                <div className="crm-mono">{fmtPrice(d.findersFee || 0)}</div>
                                <div className="lead-sub">Finder's fee</div>
                              </div>
                              <div className="simple-deal-detail">
                                <div>{d.moveInDate ? fmtDate(new Date(d.moveInDate)) : "No move-in date"}</div>
                                <div className="lead-sub">{d.signedLease ? "Lease signed" : "Lease not signed"}</div>
                                {status === "Active" && pastMoveIn && (
                                  <button className="link-btn" onClick={() => updateRentalDeal(d.id, "status", "Completed")}>Move-in date passed — mark Completed?</button>
                                )}
                              </div>
                              <div className="simple-deal-actions">
                                <button className="stage-btn" onClick={() => setRentalDealDrawerId(d.id)}>Details</button>
                                <select className="cell-input" style={{ width: 120 }} value={d.status} onChange={(e) => updateRentalDeal(d.id, "status", e.target.value)}>
                                  {RENTAL_DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button className="row-remove" onClick={() => removeRentalDeal(d.id)}><X size={13} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}

          {nav === "offers" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Handshake size={12} /> Offers sit here before they become a deal. Mark "Agreed: Yes" once a price is settled and it moves straight into the Deals tab automatically. "No Deal" offers just stay here until deleted — nothing happens to them on their own.
              </div>

              <div className="filter-bar">
                <div style={{ flex: 1 }} />
                {currentRole === "masterAdmin" && (
                  <label className="file-input-label" style={{ marginTop: 0, marginRight: 8 }}>
                    <Upload size={13} /> Import Excel/CSV
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
                      onChange={(e) => { handleOffersImport(e.target.files[0]); e.target.value = ""; }} />
                  </label>
                )}
                <button className="stage-btn active" onClick={() => addManualOffer()}>+ Add offer</button>
              </div>

              {currentRole === "masterAdmin" && (
                <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                  <Info size={12} /> Bulk upload columns (header names, case/spacing don't matter): <strong>Agent</strong> (required — matched by name), Listing Agent, Property, Suburb, Asking Price, Offer Made, Conditions, Seller Counter Offer, Buyer Counter Offer, Agreed (Pending/Yes/No), Agreed Price, Buyer Name, Seller Name, Shared Deal, Shared With Agent, Split, Com % ex VAT. Blank cells default to 0/blank. Rows are only ever <strong>added</strong>, never used to overwrite an existing offer — a re-upload skips any row whose Agent + Property + Suburb already matches one on file. .xlsx and .csv both work through the same button.
                </div>
              )}

              {offerImportSummary && (
                <div className={"req-note import-banner " + (offerImportSummary.error ? "import-error" : "")} style={{ marginTop: 0, marginBottom: 12 }}>
                  {offerImportSummary.error ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                  <div style={{ flex: 1 }}>
                    {offerImportSummary.error
                      ? offerImportSummary.error
                      : "“" + offerImportSummary.fileName + "” — added " + offerImportSummary.added + " offer" + (offerImportSummary.added === 1 ? "" : "s") +
                        (offerImportSummary.skipped > 0 ? ", skipped " + offerImportSummary.skipped + " already on file" : "") +
                        (offerImportSummary.missingAgent > 0 ? ", " + offerImportSummary.missingAgent + " row" + (offerImportSummary.missingAgent === 1 ? "" : "s") + " skipped — agent name not recognized" +
                          (offerImportSummary.unknownAgents?.length ? " (" + offerImportSummary.unknownAgents.join(", ") + ")" : "") : "") + "."}
                  </div>
                  <button className="drawer-close" onClick={() => setOfferImportSummary(null)}><X size={14} /></button>
                </div>
              )}

              {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
                <div className="stat-grid" style={{ marginBottom: 16 }}>
                  <div className="stat-card">
                    <div className="stat-label">Offers this quarter</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{offerBoardStats.thisQuarter}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Agreed → deal rate</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{offerBoardStats.conversionPct}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Top agent</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{offerBoardStats.topAgent}</div>
                  </div>
                </div>
              )}

              {scopedOffers.length === 0 && fallenThroughDeals.length === 0 ? (
                <div className="panel">
                  <div style={{ padding: 24, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>
                    No offers yet. They'll show up here as soon as a lead moves to "Offer Made" in the Pipeline, or add one manually.
                  </div>
                </div>
              ) : (
                <>
                  <div className="offer-board">
                    {OFFER_STAGES.map((stage) => {
                      const stageOffers = scopedOffers.filter((o) => offerStage(o) === stage.key);
                      return (
                        <div
                          className="offer-board-col"
                          key={stage.key}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleOfferDrop(stage.key)}
                        >
                          <div className="offer-board-col-head">{stage.label} <span>{stageOffers.length}</span></div>
                          {stageOffers.map((o) => {
                            const agent = agentsList.find((a) => a.id === o.agent);
                            const days = Math.max(0, Math.floor((Date.now() - o.date.getTime()) / 86400000));
                            const price = o.agreed === "Yes" ? o.agreedPrice : (o.offerMade || o.askingPrice || 0);
                            return (
                              <div
                                className="offer-card"
                                key={o.id}
                                draggable
                                onDragStart={() => setDraggedOfferId(o.id)}
                                onDragEnd={() => setDraggedOfferId(null)}
                                onClick={() => openOfferDrawer(o.id)}
                              >
                                <div className="offer-card-agent">
                                  <span className="agent-avatar-sm">{agent?.initials}</span>
                                  <span>{agent?.name || "Unassigned"}</span>
                                </div>
                                <div className="offer-card-property">{o.property || "Untitled"}</div>
                                <div className="offer-card-buyers">{[o.buyerName, o.sellerName].filter(Boolean).join(" · ") || "No parties yet"}</div>
                                <div className="offer-card-foot">
                                  <span className="crm-mono">{fmtPrice(price)}</span>
                                  <span>{days === 0 ? "Today" : days + "d"}</span>
                                </div>
                              </div>
                            );
                          })}
                          {stageOffers.length === 0 && <div className="offer-board-empty">Drop here</div>}
                        </div>
                      );
                    })}
                  </div>

                  {fallenThroughDeals.length > 0 && (
                    <>
                      <div className="panel-head" style={{ padding: "20px 0 10px 0", border: "none" }}>
                        <h3>Fell Through After Agreement ({fallenThroughDeals.length})</h3>
                      </div>
                      <div className="panel offer-fallthrough-section">
                        {fallenThroughDeals.map((d) => (
                          <div className="lead-row" key={d.id} style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto" }}>
                            <div>
                              <div className="lead-name">{d.property}</div>
                              <div className="lead-sub">{d.suburb} · {d.month}</div>
                            </div>
                            <div className="lead-sub">{agentName(d.agent)}</div>
                            <div className="crm-mono lead-sub">Agreed: {fmtPrice(d.agreedOffer || 0)}</div>
                            <div className="crm-mono lead-sub">Commission: {fmtPrice(d.confirmedCommission || 0)}</div>
                            <span className="badge badge-fellthrough">Fell Through</span>
                            <button className="stage-btn" onClick={() => setNav("deals")}>Open in Deals</button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

            </>
          )}

          {nav === "deals" && (
            <>
              <div className="filter-bar">
                <div className="req-note" style={{ marginTop: 0, flex: 1 }}>
                  <Info size={12} /> Deals are added automatically once a lead reaches Offer Made or Sold — or add one manually, or import a pipeline spreadsheet.
                </div>
                <label className="file-input-label" style={{ marginTop: 0, marginRight: 8 }}>
                  <Upload size={13} /> Import Excel
                  <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImportFile} />
                </label>
                <div style={{ position: "relative" }}>
                  <button className="stage-btn" onClick={() => setColumnPanelOpen((v) => !v)}>
                    <Columns3 size={13} style={{ marginRight: 4 }} /> Customize columns
                  </button>
                  {columnPanelOpen && (
                    <>
                      <div className="column-panel-backdrop" onClick={() => setColumnPanelOpen(false)} />
                      <div className="column-panel">
                        <div className="column-panel-head">
                          <span>Drag to reorder · check to show</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button className="link-btn" onClick={resetColumns}>Reset</button>
                            <button className="drawer-close" onClick={() => setColumnPanelOpen(false)}><X size={14} /></button>
                          </div>
                        </div>
                        <div className="column-panel-list">
                          {columnOrder.map((key) => {
                            const col = DEAL_COLUMN_MAP[key];
                            if (!col || roleRestrictedKeys.includes(key)) return null;
                            return (
                              <div
                                key={key}
                                className={"column-panel-row " + (draggedColKey === key ? "dragging" : "")}
                                draggable
                                onDragStart={() => setDraggedColKey(key)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => { if (draggedColKey) reorderColumn(draggedColKey, key); setDraggedColKey(null); }}
                                onDragEnd={() => setDraggedColKey(null)}
                              >
                                <GripVertical size={13} className="drag-handle" />
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={!hiddenColumns.includes(key)}
                                    onChange={() => toggleColumnVisibility(key)}
                                  />
                                  {col.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button className="stage-btn active" onClick={() => addManualDeal()}>+ Add deal</button>
              </div>

              {importSummary && (
                <div className={"req-note import-banner " + (importSummary.error ? "import-error" : "")} style={{ marginTop: 0, marginBottom: 12 }}>
                  {importSummary.error ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                  <div style={{ flex: 1 }}>
                    {importSummary.error
                      ? importSummary.error
                      : "\u201c" + importSummary.fileName + "\u201d — added " + importSummary.added + " new deal" + (importSummary.added === 1 ? "" : "s") +
                        " to " + importSummary.agentName + (importSummary.skipped > 0 ? ", skipped " + importSummary.skipped + " already in the ledger" : "") + "."}
                  </div>
                  <button className="drawer-close" onClick={() => setImportSummary(null)}><X size={14} /></button>
                </div>
              )}

              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Total Commission auto-calculates as Agreed Offer × Com % ex VAT. Deal Status decides where it counts: Above the line → Confirmed; Suspensive Bond / Suspensive of Bond and Sale / Full Cash awaiting Cash / Suspensive of Sale only Cash from Proceeds → Suspensive; Fallen through → removed from the pipeline entirely. Commission split then applies to Total Commission: 5% marketing fee, 10% listing commission, then the agent's tier share — Yellow 25%, Blue 35%, Silver 40%, Gold 45%. The Agent column stays pinned while you scroll; drag column headers or use "Customize columns" to reorder, hide, or resize the rest. For Agents, only OTP Sent, Transfer Progress, and Deal Status are editable here — every other column is greyed out and can only be changed by Master Admin or Office Manager.
              </div>

              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <Info size={12} /> Grouped into four sections by Deal Status. "Suspensive of Sale only Cash from Proceeds" is grouped into Awaiting Cash below, since it doesn't name-match any of the four — flag it if you'd rather it sat elsewhere.
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Above the Line — Confirmed Deals ({dealsAboveLine.length})</h3>
              </div>
              <div style={{ marginBottom: 24 }}>
                {renderDealsTable(dealsAboveLine, "No confirmed deals yet.")}
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Suspensive Bond Only ({dealsBondOnly.length})</h3>
              </div>
              <div style={{ marginBottom: 24 }}>
                {renderDealsTable(dealsBondOnly, "Nothing waiting on bond approval only.")}
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Awaiting Cash ({dealsAwaitingCash.length})</h3>
              </div>
              <div style={{ marginBottom: 24 }}>
                {renderDealsTable(dealsAwaitingCash, "Nothing awaiting a cash payment.")}
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Subject to Sale and Subject to Bond ({dealsSaleAndBond.length})</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Once the buyer's own sale condition has been met on one of these, click "Sale Condition Met" to move it into Suspensive Bond Only above — only the bond condition is left outstanding at that point.
              </div>
              {dealsSaleAndBond.length === 0 ? (
                <div className="panel">
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing subject to both sale and bond right now.</div>
                </div>
              ) : (
                <div className="panel">
                  {dealsSaleAndBond.map((d) => (
                    <div className="lead-row" key={d.id} style={{ gridTemplateColumns: "1.4fr 1fr 1fr auto" }}>
                      <div>
                        <div className="lead-name">{d.property}</div>
                        <div className="lead-sub">{d.suburb} · {d.month}</div>
                      </div>
                      <div className="lead-sub">{agentName(d.agent)}</div>
                      <div className="crm-mono lead-sub">{fmtPrice(d.confirmedCommission || 0)}</div>
                      <button className="stage-btn active" onClick={() => markSaleConditionMet(d.id)}>Sale Condition Met →</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="panel-head" style={{ padding: "24px 0 10px 0", border: "none" }}>
                <h3>Registered Deals ({dealsRegistered.length})</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Click "Registered" on any deal above (right at the end of its row) to move it here — you'll be asked for the actual registration date, which gets timestamped as a note on the deal.
              </div>
              <div style={{ marginBottom: 24 }}>
                {renderDealsTable(dealsRegistered, "Nothing registered yet.")}
              </div>
            </>
          )}

          {nav === "listings" && (
            <div className="listing-grid">
              {listingsData.map((l) => (
                <div className="listing-card" key={l.id}>
                  <div className="listing-photo"><Building2 size={26} /></div>
                  <div className="listing-body">
                    <div className="listing-ref crm-mono">{l.ref} · {l.status}</div>
                    <div className="listing-addr">{l.address}</div>
                    <div className="listing-suburb"><MapPin size={12} /> {l.suburb}</div>
                    <div className="listing-price">{fmtPrice(l.price)}</div>
                    <div className="listing-meta">
                      <span><Bed size={12} /> {l.beds}</span>
                      <span><Bath size={12} /> {l.baths}</span>
                      <span><Car size={12} /> {l.parking}</span>
                    </div>
                    <div className="portal-row">
                      {l.portals.map((p) => <span key={p} className={"badge " + SOURCES[p].cls}>{SOURCES[p].label}</span>)}
                      {l.fromCanvassing && <span className="badge note-typeFollowup"><Compass size={10} style={{ marginRight: 3 }} />From canvassing</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {nav === "contacts" && (() => {
            const CONTACT_CATEGORIES = ["Landlord/Property Owner", "Tenant", "Buyer", "Attorney", "Lead", ...PARTY_CONTACT_LABELS];
            const filtered = allContacts
              .filter((c) => contactsFilter === "all" || c.category === contactsFilter)
              .filter((c) => {
                if (!contactsSearch.trim()) return true;
                const q = contactsSearch.toLowerCase();
                return (c.name || "").toLowerCase().includes(q) || (c.phone || "").includes(q) || (c.email || "").toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q);
              });
            return (
              <>
                <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                  <Info size={12} /> Every Landlord/Property Owner, Buyer, Attorney, and Lead already in KORE, in one place — including canvassing records where no contact information could be found, kept here for reference rather than lost.
                </div>
                <div className="filter-bar">
                  <div className="search-wrap" style={{ maxWidth: 260 }}>
                    <Search />
                    <input className="search-input" placeholder="Name, phone, email, address" value={contactsSearch} onChange={(e) => setContactsSearch(e.target.value)} />
                  </div>
                  <select className="select" value={contactsFilter} onChange={(e) => setContactsFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    {CONTACT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ flex: 1 }} />
                  <button className="stage-btn active" onClick={() => setAddContactOpen(true)}>+ Add Contact</button>
                </div>

                <div className="stat-grid" style={{ marginBottom: 16 }}>
                  {CONTACT_CATEGORIES.map((cat) => (
                    <div className="stat-card" key={cat}>
                      <div className="stat-label">{cat}s</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{allContacts.filter((c) => c.category === cat).length}</div>
                    </div>
                  ))}
                </div>

                <div className="panel">
                  {filtered.length === 0 && (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No contacts match this filter yet.</div>
                  )}
                  {filtered.map((c) => {
                    const linkable = c.source === "Manually added";
                    return (
                    <div
                      className={"lead-row " + (linkable ? "contact-row-linkable" : "")}
                      key={c.id}
                      style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.8fr" }}
                      onClick={linkable ? () => openContactDetail(c.id) : undefined}
                    >
                      <div>
                        <div className="lead-name">{c.name}</div>
                        <div className="lead-sub">{c.address || "—"}</div>
                      </div>
                      <span className="badge note-typeFollowup">{c.category}</span>
                      <div className="lead-sub">{c.phone || "No number"}</div>
                      <div className="lead-sub">{c.email || "No email"}</div>
                      <div style={{ textAlign: "right" }}>
                        {c.noInfo ? (
                          <span className="badge offer-no">No Info Found</span>
                        ) : c.agent ? (
                          <span className="lead-sub">{agentName(c.agent)}</span>
                        ) : (
                          <span className="lead-sub">{c.source}</span>
                        )}
                      </div>
                    </div>
                  );})}
                </div>

                {addContactOpen && (
                  <div className="drawer-overlay" onClick={() => setAddContactOpen(false)}>
                    <div className="register-confirm-modal" style={{ alignSelf: "center" }} onClick={(e) => e.stopPropagation()}>
                      <div className="drawer-head" style={{ padding: "16px 18px" }}>
                        <h1 className="crm-display" style={{ fontSize: 16 }}>Add Contact</h1>
                        <button className="drawer-close" onClick={() => setAddContactOpen(false)}><X size={18} /></button>
                      </div>
                      <div style={{ padding: "0 18px 18px 18px" }}>
                        <div className="field-label" style={{ marginTop: 0 }}>Category</div>
                        <select className="req-input" value={contactFormDraft.category} onChange={(e) => setContactFormDraft((d) => ({ ...d, category: e.target.value }))}>
                          {CONTACT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="field-label">Name</div>
                        <input type="text" className="req-input" value={contactFormDraft.name} onChange={(e) => setContactFormDraft((d) => ({ ...d, name: e.target.value }))} />
                        <div className="field-label">Phone</div>
                        <input type="text" className="req-input" value={contactFormDraft.phone} onChange={(e) => setContactFormDraft((d) => ({ ...d, phone: e.target.value }))} />
                        <div className="field-label">Email</div>
                        <input type="text" className="req-input" value={contactFormDraft.email} onChange={(e) => setContactFormDraft((d) => ({ ...d, email: e.target.value }))} />
                        <div className="field-label">Address</div>
                        <input type="text" className="req-input" value={contactFormDraft.address} onChange={(e) => setContactFormDraft((d) => ({ ...d, address: e.target.value }))} />
                        <button className="stage-btn active" style={{ marginTop: 12, width: "100%" }} onClick={addManualContact}>Add Contact</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {nav === "agents" && (
            <>
              {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
                <>
                  <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                    <h3>Agent contact directory</h3>
                  </div>
                  <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                    <Info size={12} /> Fill these in once here rather than visiting each agent's profile — this is what auto-populates the Offer to Purchase emails, based on whichever agent is on the deal.
                  </div>
                  <div className="panel" style={{ marginBottom: 24, overflowY: "auto", maxHeight: 360 }}>
                    {agentsList.map((a) => (
                      <div className="access-row" key={a.id} style={{ cursor: "default" }}>
                        <span className="agent-avatar-sm">{a.initials}</span>
                        <span className="access-row-name">{a.name}</span>
                        <input
                          type="text"
                          className="req-input"
                          style={{ marginTop: 0, maxWidth: 160 }}
                          placeholder="Cell number"
                          value={(agentContacts[a.id] || {}).cell || ""}
                          onChange={(e) => setAgentContactField(a.id, "cell", e.target.value)}
                        />
                        <input
                          type="email"
                          className="req-input"
                          style={{ marginTop: 0, maxWidth: 220, marginLeft: 8 }}
                          placeholder="Email address"
                          value={(agentContacts[a.id] || {}).email || ""}
                          onChange={(e) => setAgentContactField(a.id, "email", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="agent-grid">
                {agentsList.map((a) => {
                  const activeLeads = leads.filter((l) => l.agent === a.id && !["Sold", "Lost"].includes(l.status)).length;
                  return (
                    <button className="agent-card" key={a.id} onClick={() => openAgentProfile(a.id)}>
                      <div className="agent-avatar">{a.initials}</div>
                      <div className="agent-name">{a.name}</div>
                      <div className="agent-stat">{activeLeads} active leads</div>
                      <div className="agent-stat"><TrendingUp size={11} style={{ display: "inline", marginRight: 3 }} />{a.closed} sold this year</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {nav === "rentalagents" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
            <>
              <div className="filter-bar">
                <div className="req-note" style={{ marginTop: 0, flex: 1 }}>
                  <Info size={12} /> The Rentals roster — no login yet, just who deals can be assigned to.
                </div>
                <button className="stage-btn active" onClick={addRentalAgentRow}>+ Add rental agent</button>
              </div>
              <div className="panel" style={{ marginBottom: 24 }}>
                {rentalAgentsList.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No rental agents yet.</div>
                )}
                {rentalAgentsList.map((a) => (
                  <div className="access-row" key={a.id} style={{ gap: 10, alignItems: "center", flexWrap: "wrap", cursor: "default", opacity: a.active === false ? 0.55 : 1 }}>
                    <label style={{ cursor: "pointer" }}>
                      {a.photoUrl
                        ? <img src={a.photoUrl} alt={a.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                        : <span className="agent-avatar-sm">{a.initials}</span>}
                      <input type="file" accept="image/*" style={{ display: "none" }}
                        onChange={(e) => handleUploadRentalAgentPhoto(a.id, e.target.files?.[0])} />
                    </label>
                    <span className="access-row-name" style={{ flex: "0 1 130px", minWidth: 90 }}>
                      {a.name}
                      {a.active === false && <span className="badge" style={{ marginLeft: 6, fontSize: 10 }}>Inactive</span>}
                    </span>
                    <input className="req-input" style={{ marginTop: 0, width: 110 }} placeholder="Title" value={a.title || ""}
                      onChange={(e) => updateRentalAgentField(a.id, "title", e.target.value)} />
                    <input className="req-input" style={{ marginTop: 0, width: 120 }} placeholder="Cell" value={a.cell || ""}
                      onChange={(e) => updateRentalAgentField(a.id, "cell", e.target.value)} />
                    <input className="req-input" style={{ marginTop: 0, width: 160 }} placeholder="Email" type="email" value={a.email || ""}
                      onChange={(e) => updateRentalAgentField(a.id, "email", e.target.value)} />
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                      {a.active === false ? (
                        <button className="stage-btn" onClick={() => setRentalAgentActive(a.id, true)}>Reactivate</button>
                      ) : (
                        <button className="stage-btn" onClick={() => setRentalAgentActive(a.id, false)}>Deactivate</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {nav === "rentalleaderboard" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
            <>
              <div className="panel">
                {rentalLeaderboard.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No rental agents yet.</div>
                )}
                {rentalLeaderboard.map((row, i) => {
                  // Not reachable today (Rentals is masterAdmin/officeManager
                  // only, no rental-agent logins exist yet) — written so
                  // it's already correct once those logins are added, same
                  // blur-except-your-own-row rule as the Sales leaderboard.
                  const shouldBlur = currentRole === "agent" && row.agent.id !== currentAgentId;
                  return (
                    <div className="lead-row" key={row.agent.id} style={{ gridTemplateColumns: "40px 1.4fr 1fr 1fr" }}>
                      <div className="lead-sub" style={{ fontWeight: 700 }}>{i + 1}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="agent-avatar-sm">{row.agent.initials}</span>
                        <span className="lead-name">{row.agent.name}</span>
                      </div>
                      <div className="lead-sub">{row.deals} deal{row.deals === 1 ? "" : "s"}</div>
                      <div className={"crm-mono " + (shouldBlur ? "amount-blurred" : "")} style={{ fontWeight: 700, color: "var(--ink)" }}>{fmtPrice(Math.round(row.total))}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {nav === "todos" && (
            <>
              <div className="req-note" style={{ marginBottom: 16, marginTop: 0 }}>
                <Info size={12} /> This list only shows tasks assigned to {agentName(currentAgentId)}.
              </div>

              <div className="ms-todo-bar">
                <ListChecks size={14} />
                {msTodoStatus.connected ? (
                  <>
                    <span>Syncing to Microsoft To Do ({msTodoStatus.msEmail})</span>
                    <button className="link-btn" style={{ marginLeft: "auto" }} onClick={disconnectMsTodo}>Disconnect</button>
                  </>
                ) : (
                  <>
                    <span>New tasks aren't syncing to Microsoft To Do yet.</span>
                    <button className="stage-btn active" style={{ marginLeft: "auto" }} disabled={msTodoBusy} onClick={connectMsTodo}>
                      {msTodoBusy ? "Connecting…" : "Connect Microsoft To Do"}
                    </button>
                  </>
                )}
              </div>

              <div className="filter-bar" style={{ marginBottom: 16 }}>
                <div className="view-toggle">
                  <button className={"toggle-btn " + (todoFilter === "today" ? "active" : "")} onClick={() => setTodoFilter("today")}>Today</button>
                  <button className={"toggle-btn " + (todoFilter === "week" ? "active" : "")} onClick={() => setTodoFilter("week")}>This Week</button>
                  <button className={"toggle-btn " + (todoFilter === "month" ? "active" : "")} onClick={() => setTodoFilter("month")}>This Month</button>
                  <button className={"toggle-btn " + (todoFilter === "all" ? "active" : "")} onClick={() => setTodoFilter("all")}>All Tasks</button>
                </div>
                <div style={{ flex: 1 }} />
                <button className="stage-btn active" onClick={openAddTask}>+ Add task</button>
              </div>

              {addTaskOpen && (
                <div className="drawer-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={() => setAddTaskOpen(false)}>
                  <div className="register-confirm-modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-head" style={{ padding: "16px 18px" }}>
                      <h1 className="crm-display" style={{ fontSize: 16 }}>Add task</h1>
                      <button className="drawer-close" onClick={() => setAddTaskOpen(false)}><X size={18} /></button>
                    </div>
                    <div style={{ padding: "0 18px 18px 18px" }}>
                      <div className="field-label" style={{ marginTop: 0 }}>Assign to</div>
                      <select className="req-input" value={addTaskDraft.agentId} onChange={(e) => setAddTaskDraft((d) => ({ ...d, agentId: e.target.value }))}>
                        {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <div className="field-label">Type</div>
                      <select className="req-input" value={addTaskDraft.kind} onChange={(e) => setAddTaskDraft((d) => ({ ...d, kind: e.target.value }))}>
                        {TASK_KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <div className="field-label">Note</div>
                      <input type="text" className="req-input" placeholder="What needs to be done" value={addTaskDraft.label} onChange={(e) => setAddTaskDraft((d) => ({ ...d, label: e.target.value }))} />
                      <div className="field-label">Due date</div>
                      <input type="date" className="req-input" value={addTaskDraft.dueDate} onChange={(e) => setAddTaskDraft((d) => ({ ...d, dueDate: e.target.value }))} />
                      <button className="stage-btn active" style={{ marginTop: 14, width: "100%" }} onClick={submitAddTask}>Add task</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="panel-head"><h3>Open ({myOpenTodos.length})</h3></div>
                {myOpenTodos.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing outstanding — nice and clear.</div>
                )}
                {myOpenTodos.map((t) => {
                  const overdue = isTodoOverdue(t);
                  const kindLabel = todoKindLabel(t.kind);
                  return (
                    <div className={"todo-row " + (overdue ? "todo-row-overdue" : "")} key={t.id}>
                      <button className="todo-check" onClick={() => toggleTodo(t.id)}><Circle size={17} /></button>
                      <div style={{ flex: 1 }}>
                        <div className="todo-label">
                          {overdue && <span className="overdue-flag">!</span>}
                          {t.label}
                        </div>
                        <div className="lead-sub">
                          {kindLabel} · {fmtDate(t.createdAt)}
                          {t.kind === "canvas-number-request" && t.requestedBy && <> · requested by {agentName(t.requestedBy)}</>}
                          {t.dueDate && <> · due {fmtDate(new Date(t.dueDate))}</>}
                          {overdue && <span className="overdue-text"> · {daysOverdue(t)} day{daysOverdue(t) === 1 ? "" : "s"} overdue</span>}
                        </div>
                      </div>
                      <button
                        className="stage-btn"
                        onClick={() => {
                          if (t.kind === "otp-send" && t.dealId) { openOtpDrawer(t.dealId); setNav("deals"); return; }
                          if (t.kind === "canvas-number-request" && t.dkId) {
                            const dk = doorKnocks.find((x) => x.id === t.dkId);
                            if (dk) {
                              setEditCanvasId(dk.id);
                              setCanvasFormDraft({
                                address: dk.address, suburb: dk.suburb, sellPrice: dk.sellPrice, marketingLink: dk.marketingLink || "",
                                ownerName: dk.ownerName, ownerPhone: dk.ownerPhone, emailContactDetails: dk.emailContactDetails,
                                followUpDate: dk.followUpDate ? new Date(dk.followUpDate).toISOString().slice(0, 10) : "",
                              });
                              setAddCanvasOpen(true);
                            }
                            setNav("canvassing");
                            return;
                          }
                          if (t.kind === "canvas-call" && t.dkId) {
                            const dk = doorKnocks.find((x) => x.id === t.dkId);
                            if (dk) openDK(dk);
                            setNav("canvassing");
                            return;
                          }
                          if (t.offerId) { openOfferDrawer(t.offerId); setNav("offers"); return; }
                          const l = leads.find((x) => x.id === t.leadId);
                          if (l) openLead(l);
                        }}
                      >
                        {t.kind === "otp-send" ? "Open deal" : t.kind === "canvas-number-request" ? "Add details" : t.kind === "canvas-call" ? "Open record" : t.offerId ? "Open offer" : "Open buyer"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {myDoneTodos.length > 0 && (
                <div className="panel">
                  <div className="panel-head"><h3>Done ({myDoneTodos.length})</h3></div>
                  {myDoneTodos.map((t) => (
                    <div className="todo-row done" key={t.id}>
                      <button className="todo-check" onClick={() => toggleTodo(t.id)}><CheckCircle2 size={17} /></button>
                      <div style={{ flex: 1 }}>
                        <div className="todo-label">{t.label}</div>
                        <div className="lead-sub">{todoKindLabel(t.kind)} · {fmtDate(t.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(currentRole === "masterAdmin" || currentRole === "officeManager") && (
                <div className="panel" style={{ marginTop: 16 }}>
                  <div className="panel-head"><h3>All open tasks, every agent ({allOpenTodos.length})</h3></div>
                  {allOpenTodos.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing outstanding office-wide.</div>
                  ) : (
                    allOpenTodos.map((t) => {
                      const overdue = isTodoOverdue(t);
                      return (
                        <div className={"todo-row " + (overdue ? "todo-row-overdue" : "")} key={t.id}>
                          <button className="todo-check" onClick={() => toggleTodo(t.id)}><Circle size={17} /></button>
                          <div style={{ flex: 1 }}>
                            <div className="todo-label">
                              {overdue && <span className="overdue-flag">!</span>}
                              {t.label}
                            </div>
                            <div className="lead-sub">
                              {agentName(t.agentId)} · {todoKindLabel(t.kind)} · {fmtDate(t.createdAt)}
                              {t.dueDate && <> · due {fmtDate(new Date(t.dueDate))}</>}
                              {overdue && <span className="overdue-text"> · {daysOverdue(t)} day{daysOverdue(t) === 1 ? "" : "s"} overdue</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}

          {nav === "tools" && <ToolsPage />}

          {nav === "targets" && (currentRole === "masterAdmin" || currentRole === "officeManager") && activeVertical === "sales" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <Target size={12} /> Set a yearly gross commission target per agent — it's automatically split into monthly (÷12) and quarterly (÷4) targets and tracked against their actual Confirmed pipeline. Only Office Manager and Master Admin can set these; each agent only ever sees their own on their Dashboard.
              </div>

              <div className="filter-bar">
                <select className="select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {dealYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Yearly Target</th>
                      <th>Monthly</th>
                      <th>Quarterly</th>
                      <th>Achieved YTD</th>
                      <th>% of Target</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentsList.map((a) => {
                      const progress = buildTargetProgress(a.id, selectedYear);
                      const pct = progress.yearly > 0 ? Math.round((progress.total / progress.yearly) * 100) : 0;
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="agent-link" style={{ cursor: "default" }}>
                              <span className="agent-avatar-sm">{a.initials}</span> {a.name}
                            </div>
                          </td>
                          <td>
                            <div className="req-input-wrap crm-mono" style={{ marginTop: 0, minWidth: 130 }}>
                              <span>R</span>
                              <MoneyInput
                                className="req-input"
                                value={getYearlyTarget(a.id, selectedYear)}
                                onChange={(e) => setYearlyTarget(a.id, selectedYear, e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.monthly))}</td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.quarterly))}</td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.total))}</td>
                          <td className="pt-count">{progress.yearly > 0 ? pct + "%" : <span className="pt-zero">—</span>}</td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.remaining))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {nav === "targets" && (currentRole === "masterAdmin" || currentRole === "officeManager") && activeVertical === "rentals" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <Target size={12} /> Set a yearly target on number of <strong>managed</strong> deals completed per rental agent — split into quarterly/monthly, tracked against deals that reached Completed status with Managed checked.
              </div>

              <div className="filter-bar">
                <select className="select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {dealYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Yearly Target (managed deals)</th>
                      <th>This Quarter</th>
                      <th>Completed YTD</th>
                      <th>% of Target</th>
                      <th>Still needed (quarter)</th>
                      <th>Still needed (year)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalAgentsList.filter((a) => a.active !== false).map((a) => {
                      const progress = buildRentalTargetProgress(a.id, selectedYear);
                      const pct = progress.yearly > 0 ? Math.round((progress.total / progress.yearly) * 100) : 0;
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="agent-link" style={{ cursor: "default" }}>
                              <span className="agent-avatar-sm">{a.initials}</span> {a.name}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number" className="req-input crm-mono" style={{ marginTop: 0, width: 90 }}
                              value={getRentalYearlyTarget(a.id, selectedYear)}
                              onChange={(e) => setRentalYearlyTarget(a.id, selectedYear, e.target.value)}
                            />
                          </td>
                          <td className="crm-mono pt-count">{progress.byQuarter[progress.currentQuarter] || 0} of {Math.round(progress.quarterly)}</td>
                          <td className="crm-mono pt-count">{progress.total}</td>
                          <td className="pt-count">{progress.yearly > 0 ? pct + "%" : <span className="pt-zero">—</span>}</td>
                          <td className="crm-mono pt-count">{progress.quarterRemaining}</td>
                          <td className="crm-mono pt-count">{progress.remaining}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="req-note" style={{ marginTop: 24, marginBottom: 16 }}>
                <Target size={12} /> Set a yearly gross commission target on <strong>Finder's Fee</strong> per rental agent — it's automatically split into monthly (÷12) and quarterly (÷4) targets and tracked against Finder's Fee on deals that reached Completed status (managed or not).
              </div>

              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Yearly Target</th>
                      <th>Monthly</th>
                      <th>Quarterly</th>
                      <th>Achieved YTD</th>
                      <th>% of Target</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalAgentsList.filter((a) => a.active !== false).map((a) => {
                      const progress = buildRentalCommissionTargetProgress(a.id, selectedYear);
                      const pct = progress.yearly > 0 ? Math.round((progress.total / progress.yearly) * 100) : 0;
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="agent-link" style={{ cursor: "default" }}>
                              <span className="agent-avatar-sm">{a.initials}</span> {a.name}
                            </div>
                          </td>
                          <td>
                            <div className="req-input-wrap crm-mono" style={{ marginTop: 0, minWidth: 130 }}>
                              <span>R</span>
                              <MoneyInput
                                className="req-input"
                                value={getRentalYearlyCommissionTarget(a.id, selectedYear)}
                                onChange={(e) => setRentalYearlyCommissionTarget(a.id, selectedYear, e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.monthly))}</td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.quarterly))}</td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.total))}</td>
                          <td className="pt-count">{progress.yearly > 0 ? pct + "%" : <span className="pt-zero">—</span>}</td>
                          <td className="crm-mono pt-count">{fmtPrice(Math.round(progress.remaining))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {nav === "attorneybonds" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <FileText size={12} /> Ranked by how often each attorney or bond originator has been nominated on a deal. Only Office Manager and Master Admin can see this.
              </div>

              <PeriodPicker
                mode={periodMode} setMode={setPeriodMode}
                quarter={selectedQuarter} setQuarter={setSelectedQuarter}
                month={selectedMonth} setMonth={setSelectedMonth}
                year={selectedYear} setYear={setSelectedYear}
                years={dealYears}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                    <h3>Attorney leaderboard</h3>
                  </div>
                  <div className="panel">
                    {attorneyLeaderboard.length === 0 && (
                      <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No attorney nominated on any deal yet for this period.</div>
                    )}
                    {attorneyLeaderboard.map((row, i) => (
                      <div className="leaderboard-row" key={row.name} style={{ cursor: "default" }}>
                        <div className="rank-badge">{i + 1}</div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div className="lead-name">{row.name}</div>
                          <div className="lead-sub">{row.deals} deal{row.deals === 1 ? "" : "s"}</div>
                        </div>
                        <div className="crm-mono leaderboard-amount">{fmtPrice(Math.round(row.value))}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                    <h3>Bond Through leaderboard</h3>
                  </div>
                  <div className="panel">
                    {bondThroughLeaderboard.length === 0 && (
                      <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No Bond Through selected on any deal yet for this period.</div>
                    )}
                    {bondThroughLeaderboard.map((row, i) => (
                      <div className="leaderboard-row" key={row.name} style={{ cursor: "default" }}>
                        <div className="rank-badge">{i + 1}</div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div className="lead-name">{row.name}</div>
                          <div className="lead-sub">{row.deals} deal{row.deals === 1 ? "" : "s"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="crm-mono leaderboard-amount">{fmtPrice(Math.round(row.bondValue))}</div>
                          <div className="lead-sub">total bonds applied for</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel-head" style={{ padding: "18px 0 10px 0", border: "none" }}>
                <h3>Attorney directory</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Mail size={12} /> Set a contact name, email, and phone number per attorney firm — these auto-fill on the Offer to Purchase emails once that attorney is nominated on a deal.
              </div>
              <div className="panel" style={{ overflowY: "auto", maxHeight: 360 }}>
                {ATTORNEY_OPTIONS.map((name) => (
                  <div className="access-row" key={name} style={{ cursor: "default" }}>
                    <span className="access-row-name">{name}</span>
                    <input
                      type="text"
                      className="req-input"
                      style={{ marginTop: 0, maxWidth: 140 }}
                      placeholder="Contact name(s)"
                      value={attorneyContacts[name] || ""}
                      onChange={(e) => setAttorneyContactName(name, e.target.value)}
                    />
                    <input
                      type="email"
                      className="req-input"
                      style={{ marginTop: 0, maxWidth: 190, marginLeft: 8 }}
                      placeholder="firm@email.com"
                      value={attorneyEmails[name] || ""}
                      onChange={(e) => setAttorneyEmail(name, e.target.value)}
                    />
                    <input
                      type="text"
                      className="req-input"
                      style={{ marginTop: 0, maxWidth: 140, marginLeft: 8 }}
                      placeholder="011 000 0000"
                      value={attorneyPhones[name] || ""}
                      onChange={(e) => setAttorneyPhoneNumber(name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {nav === "mergerequests" && (currentRole === "masterAdmin" || currentRole === "officeManager") && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 16 }}>
                <UserPlus size={12} /> When an agent imports their own spreadsheet and a contact matches someone already in the system under a different agent, it lands here instead of being imported automatically — nothing merges without your say-so.
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Pending ({mergeRequests.filter((r) => r.status === "pending").length})</h3>
              </div>
              {mergeRequests.filter((r) => r.status === "pending").length === 0 ? (
                <div className="panel" style={{ marginBottom: 24 }}>
                  <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>Nothing waiting on a merge decision.</div>
                </div>
              ) : (
                <div className="panel" style={{ marginBottom: 24 }}>
                  {mergeRequests.filter((r) => r.status === "pending").map((req) => {
                    const existing = leads.find((l) => l.id === req.existingLeadId);
                    return (
                      <div className="merge-request-row" key={req.id}>
                        <div className="merge-request-col">
                          <div className="lead-sub" style={{ fontWeight: 700, color: "var(--slate)" }}>ALREADY IN SYSTEM — {agentName(req.matchedAgentId)}</div>
                          <div className="lead-name">{existing?.name}</div>
                          <div className="lead-sub">{existing?.phone} · {existing?.email}</div>
                          <div className="lead-sub">{existing?.activity?.length || 0} activity entries on file</div>
                        </div>
                        <ArrowRight size={16} style={{ color: "#C8C4B8", flexShrink: 0 }} />
                        <div className="merge-request-col">
                          <div className="lead-sub" style={{ fontWeight: 700, color: "var(--slate)" }}>JUST IMPORTED — {agentName(req.requestingAgentId)}</div>
                          <div className="lead-name">{req.incoming.name}</div>
                          <div className="lead-sub">{req.incoming.phone} · {req.incoming.email}</div>
                          <div className="lead-sub">Matched on {req.matchReason} · {fmtDate(req.createdAt)}</div>
                        </div>
                        <div className="merge-request-actions">
                          <button className="stage-btn active" onClick={() => approveMergeRequest(req.id)}>Approve merge</button>
                          <button className="stage-btn danger-text" onClick={() => rejectMergeRequest(req.id)}>Reject</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {mergeRequests.some((r) => r.status !== "pending") && (
                <>
                  <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                    <h3>Decided</h3>
                  </div>
                  <div className="panel">
                    {mergeRequests.filter((r) => r.status !== "pending").map((req) => (
                      <div className="lead-row" key={req.id} style={{ gridTemplateColumns: "1fr 1fr auto" }}>
                        <div className="lead-name">{req.incoming.name}</div>
                        <div className="lead-sub">{agentName(req.requestingAgentId)} → {agentName(req.matchedAgentId)}</div>
                        <span className={"badge " + (req.status === "approved" ? "cond-confirmed" : "offer-no")}>{req.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {nav === "marketing" && (currentRole === "masterAdmin" || currentRole === "officeManager" || currentRole === "marketing") && (() => {
            const visibleCampaigns = marketingCampaigns.filter((c) => !c.archived && c.sector === marketingSectorView);
            const visibleBudgets = marketingBudgets.filter((b) => !b.archived && b.sector === marketingSectorView);
            const totals = visibleCampaigns.reduce((acc, c) => {
              const s = campaignStats(c);
              acc.spend += Number(c.spend) || 0;
              acc.leads += s.leads;
              acc.deals += s.deals;
              acc.commission += s.commission;
              return acc;
            }, { spend: 0, leads: 0, deals: 0, commission: 0 });
            const roiMultiple = totals.spend > 0 ? totals.commission / totals.spend : 0;
            const netReturn = totals.commission - totals.spend;
            const costPerLead = totals.leads > 0 ? totals.spend / totals.leads : 0;
            const costPerDeal = totals.deals > 0 ? totals.spend / totals.deals : 0;
            const liveCount = visibleCampaigns.filter((c) => c.status === "Live").length;

            const byPlatform = MARKETING_PLATFORMS.map((p) => {
              const camps = visibleCampaigns.filter((c) => c.platform === p);
              const t = camps.reduce((acc, c) => { const s = campaignStats(c); acc.spend += Number(c.spend) || 0; acc.leads += s.leads; acc.deals += s.deals; acc.commission += s.commission; return acc; }, { spend: 0, leads: 0, deals: 0, commission: 0 });
              return { name: p, ...t, roi: t.spend > 0 ? t.commission / t.spend : 0 };
            }).filter((p) => marketingCampaigns.some((c) => c.platform === p.name && !c.archived));

            const bySector = MARKETING_SECTORS.map((sec) => {
              const camps = marketingCampaigns.filter((c) => !c.archived && c.sector === sec);
              const t = camps.reduce((acc, c) => { const s = campaignStats(c); acc.spend += Number(c.spend) || 0; acc.leads += s.leads; acc.deals += s.deals; acc.commission += s.commission; return acc; }, { spend: 0, leads: 0, deals: 0, commission: 0 });
              return { name: sec, ...t, roi: t.spend > 0 ? t.commission / t.spend : 0 };
            });
            const maxPlatformSpend = Math.max(1, ...byPlatform.map((p) => p.spend));
            const maxSectorSpend = Math.max(1, ...bySector.map((p) => p.spend));

            const filteredCampaigns = visibleCampaigns.filter((c) => {
              if (campaignFilters.search.trim()) {
                const q = campaignFilters.search.toLowerCase();
                const brokerNames = c.brokers.map((id) => agentName(id)).join(" ").toLowerCase();
                if (!c.name.toLowerCase().includes(q) && !brokerNames.includes(q) && !(c.notes || "").toLowerCase().includes(q)) return false;
              }
              if (campaignFilters.status !== "all" && c.status !== campaignFilters.status) return false;
              if (campaignFilters.platform !== "all" && c.platform !== campaignFilters.platform) return false;
              if (campaignFilters.area !== "all" && c.area !== campaignFilters.area) return false;
              if (campaignFilters.broker !== "all" && !c.brokers.includes(campaignFilters.broker)) return false;
              if (campaignFilters.from && c.startDate < campaignFilters.from) return false;
              if (campaignFilters.to && c.endDate > campaignFilters.to) return false;
              return true;
            });

            return (
              <>
                <div className="panel canvas-intro">
                  <div>
                    <h3 className="crm-display" style={{ fontSize: 16, margin: 0 }}>Paid Marketing Tracker</h3>
                    <div className="lead-sub">Track spend, leads, deals, commission and ROI across social media, Google Ads, LinkedIn and listing campaigns.</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="view-toggle">
                      {MARKETING_SECTORS.map((s) => (
                        <button key={s} className={"toggle-btn " + (marketingSectorView === s ? "active" : "")} onClick={() => setMarketingSectorView(s)}>{s === "Residential" ? "Resi" : s}</button>
                      ))}
                    </div>
                    <button className="stage-btn" onClick={() => { setBudgetFormDraft({ name: "", platform: "Meta", sector: marketingSectorView, startDate: "", endDate: "", budget: "" }); setAddBudgetOpen(true); }}>+ Add Budget</button>
                    <button className="stage-btn active" onClick={() => { setEditCampaignId(null); setCampaignFormDraft({ name: "", budgetId: "", platform: "Meta", sector: marketingSectorView, area: "East Rand", status: "Planned", spend: "", allocation: "", startDate: "", endDate: "", brokers: [] }); setAddCampaignOpen(true); }}>+ Add Campaign</button>
                  </div>
                </div>

                <div className="stat-grid" style={{ marginBottom: 10 }}>
                  <div className="stat-card"><div className="stat-label">Total Spend</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(totals.spend))}</div></div>
                  <div className="stat-card"><div className="stat-label">Leads</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{totals.leads}</div></div>
                  <div className="stat-card"><div className="stat-label">Commission</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(totals.commission))}</div></div>
                  <div className="stat-card"><div className="stat-label">ROI Multiple</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{roiMultiple.toFixed(1)}x</div></div>
                </div>
                <div className="stat-grid" style={{ marginBottom: 18 }}>
                  <div className="stat-card"><div className="stat-label">Net Return</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(netReturn))}</div></div>
                  <div className="stat-card"><div className="stat-label">Cost Per Lead</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(costPerLead))}</div></div>
                  <div className="stat-card"><div className="stat-label">Cost Per Deal</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{fmtPrice(Math.round(costPerDeal))}</div></div>
                  <div className="stat-card"><div className="stat-label">Live Campaigns</div><div className="stat-value crm-mono" style={{ fontSize: 19 }}>{liveCount}</div></div>
                </div>

                <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3>Budgets</h3>
                    <div className="lead-sub">Campaigns must be assigned to one of these budget pools.</div>
                  </div>
                  <div className="lead-sub">{visibleBudgets.length} active</div>
                </div>
                {visibleBudgets.length === 0 ? (
                  <div className="panel" style={{ marginBottom: 20 }}><div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No budgets for {marketingSectorView} yet.</div></div>
                ) : (
                  <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    {visibleBudgets.map((b) => {
                      const bs = budgetStats(b.id);
                      const remaining = b.budget - bs.spent;
                      return (
                        <div className="panel" key={b.id} style={{ padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div className="lead-name" style={{ fontSize: 15 }}>{b.name}</div>
                              <div className="lead-sub">{b.platform} · {fmtDate(new Date(b.startDate))} to {fmtDate(new Date(b.endDate))}</div>
                            </div>
                            <button className="stage-btn danger-text" onClick={() => archiveMarketingBudget(b.id)}>Archive</button>
                          </div>
                          <div className="stat-grid" style={{ marginTop: 10, marginBottom: 6, gridTemplateColumns: "repeat(4,1fr)" }}>
                            <div className="stat-card"><div className="stat-label">Budget</div><div className="stat-value crm-mono" style={{ fontSize: 15 }}>{fmtPrice(b.budget)}</div></div>
                            <div className="stat-card"><div className="stat-label">Allocated</div><div className="stat-value crm-mono" style={{ fontSize: 15 }}>{fmtPrice(bs.allocated)}</div></div>
                            <div className="stat-card"><div className="stat-label">Spent</div><div className="stat-value crm-mono" style={{ fontSize: 15 }}>{fmtPrice(bs.spent)}</div></div>
                            <div className="stat-card"><div className="stat-label">Remaining</div><div className="stat-value crm-mono" style={{ fontSize: 15 }}>{fmtPrice(remaining)}</div></div>
                          </div>
                          <div className="lead-sub">{bs.campaignCount} campaign{bs.campaignCount === 1 ? "" : "s"}{bs.names ? " · " + bs.names : ""}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div className="panel" style={{ padding: 16 }}>
                    <h3 className="crm-display" style={{ fontSize: 14, margin: "0 0 10px 0" }}>ROI by Platform</h3>
                    {byPlatform.length === 0 && <div className="lead-sub">No campaigns yet.</div>}
                    {byPlatform.map((p) => (
                      <div key={p.name} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                          <span>{p.name}</span><span className="crm-mono">{fmtPrice(Math.round(p.spend))} · {p.roi.toFixed(1)}x</span>
                        </div>
                        <div className="target-progress-track" style={{ height: 8, marginTop: 4 }}>
                          <div className="target-progress-fill" style={{ width: (p.spend / maxPlatformSpend) * 100 + "%" }} />
                        </div>
                        <div className="lead-sub">{fmtPrice(Math.round(p.spend))} spend · {p.leads} leads · {p.deals} deals</div>
                      </div>
                    ))}
                  </div>
                  <div className="panel" style={{ padding: 16 }}>
                    <h3 className="crm-display" style={{ fontSize: 14, margin: "0 0 10px 0" }}>ROI by Sector</h3>
                    {bySector.map((p) => (
                      <div key={p.name} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                          <span>{p.name}</span><span className="crm-mono">{fmtPrice(Math.round(p.spend))} · {p.roi.toFixed(1)}x</span>
                        </div>
                        <div className="target-progress-track" style={{ height: 8, marginTop: 4 }}>
                          <div className="target-progress-fill" style={{ width: (p.spend / maxSectorSpend) * 100 + "%" }} />
                        </div>
                        <div className="lead-sub">{fmtPrice(Math.round(p.spend))} spend · {p.leads} leads · {p.deals} deals</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3>Campaigns</h3>
                    <div className="lead-sub">Compare spend, return and conversion by campaign.</div>
                  </div>
                  <div className="lead-sub">{filteredCampaigns.length} of {visibleCampaigns.length}</div>
                </div>
                <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
                  <div className="req-grid-2">
                    <div>
                      <div className="field-label" style={{ marginTop: 0 }}>Search campaigns</div>
                      <input type="text" className="req-input" placeholder="Campaign, broker, notes..." value={campaignFilters.search} onChange={(e) => setCampaignFilters((f) => ({ ...f, search: e.target.value }))} />
                    </div>
                    <div>
                      <div className="field-label" style={{ marginTop: 0 }}>Status</div>
                      <select className="req-input" value={campaignFilters.status} onChange={(e) => setCampaignFilters((f) => ({ ...f, status: e.target.value }))}>
                        <option value="all">All statuses</option>
                        {MARKETING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="req-grid-2">
                    <div>
                      <div className="field-label">Platform</div>
                      <select className="req-input" value={campaignFilters.platform} onChange={(e) => setCampaignFilters((f) => ({ ...f, platform: e.target.value }))}>
                        <option value="all">All platforms</option>
                        {MARKETING_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="field-label">Area</div>
                      <select className="req-input" value={campaignFilters.area} onChange={(e) => setCampaignFilters((f) => ({ ...f, area: e.target.value }))}>
                        <option value="all">All areas</option>
                        {MARKETING_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="req-grid-2">
                    <div>
                      <div className="field-label">Broker</div>
                      <select className="req-input" value={campaignFilters.broker} onChange={(e) => setCampaignFilters((f) => ({ ...f, broker: e.target.value }))}>
                        <option value="all">All brokers</option>
                        {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div />
                  </div>
                  <div className="req-grid-2">
                    <div>
                      <div className="field-label">From</div>
                      <input type="date" className="req-input" value={campaignFilters.from} onChange={(e) => setCampaignFilters((f) => ({ ...f, from: e.target.value }))} />
                    </div>
                    <div>
                      <div className="field-label">To</div>
                      <input type="date" className="req-input" value={campaignFilters.to} onChange={(e) => setCampaignFilters((f) => ({ ...f, to: e.target.value }))} />
                    </div>
                  </div>
                  <button className="stage-btn" style={{ marginTop: 10 }} onClick={() => setCampaignFilters({ search: "", status: "all", platform: "all", sector: "all", area: "all", broker: "all", from: "", to: "" })}>Clear filters</button>
                </div>

                {filteredCampaigns.length === 0 ? (
                  <div className="panel" style={{ marginBottom: 20 }}><div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 13 }}>No campaigns match these filters.</div></div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                    {filteredCampaigns.map((c) => {
                      const s = campaignStats(c);
                      const budget = marketingBudgets.find((b) => b.id === c.budgetId);
                      return (
                        <div className="panel" key={c.id} style={{ padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div className="lead-name" style={{ fontSize: 15 }}>{c.name}</div>
                              <div className="lead-sub">{c.platform} · {c.sector} · {c.area}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <span className={"badge " + (c.status === "Live" ? "cond-confirmed" : c.status === "Ended" ? "offer-no" : "dk-grey")}>{c.status}</span>
                              <span className="badge dk-gold">ROI {s.roi.toFixed(1)}x</span>
                              <span className="badge dk-blue">{Math.round(s.conversion)}% Conversion</span>
                            </div>
                          </div>
                          <div className="stat-grid" style={{ marginTop: 10, marginBottom: 6, gridTemplateColumns: "repeat(5,1fr)" }}>
                            <div className="stat-card"><div className="stat-label">Spend</div><div className="stat-value crm-mono" style={{ fontSize: 14 }}>{fmtPrice(Math.round(c.spend))}</div></div>
                            <div className="stat-card"><div className="stat-label">Allocation</div><div className="stat-value crm-mono" style={{ fontSize: 14 }}>{fmtPrice(Math.round(c.allocation))}</div></div>
                            <div className="stat-card"><div className="stat-label">Leads</div><div className="stat-value crm-mono" style={{ fontSize: 14 }}>{s.leads}</div></div>
                            <div className="stat-card"><div className="stat-label">Deals</div><div className="stat-value crm-mono" style={{ fontSize: 14 }}>{s.deals}</div></div>
                            <div className="stat-card"><div className="stat-label">Commission</div><div className="stat-value crm-mono" style={{ fontSize: 14 }}>{fmtPrice(Math.round(s.commission))}</div></div>
                          </div>
                          <div className="lead-sub">Budget: {budget ? budget.name : "—"}</div>
                          <div className="lead-sub">{fmtDate(new Date(c.startDate))} to {fmtDate(new Date(c.endDate))}</div>
                          <div className="lead-sub">Cost per lead {fmtPrice(Math.round(s.costPerLead))} · Cost per deal {fmtPrice(Math.round(s.costPerDeal))}</div>
                          <div className="lead-sub">Brokers: {c.brokers.length ? c.brokers.map((id) => agentName(id)).join(", ") : "No marketing assignees"}</div>
                          <div className="canvas-card-actions" style={{ marginTop: 10 }}>
                            <button className="stage-btn active" onClick={() => { setAssignLeadCampaignId(c.id); setAssignLeadDraft({ name: "", phone: "", email: "", agent: c.brokers[0] || brokerRotation[0] || "" }); }}>Assign Lead</button>
                            <button className="stage-btn" onClick={() => { setEditCampaignId(c.id); setCampaignFormDraft({ name: c.name, budgetId: c.budgetId, platform: c.platform, sector: c.sector, area: c.area, status: c.status, spend: c.spend, allocation: c.allocation, startDate: c.startDate, endDate: c.endDate, brokers: c.brokers }); setAddCampaignOpen(true); }}>Edit</button>
                            <button className="stage-btn danger-text" onClick={() => archiveCampaign(c.id)}>Archive</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16, marginBottom: 20 }}>
                  <div className="panel" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h3 className="crm-display" style={{ fontSize: 14, margin: 0 }}>Broker Rotation</h3>
                      <div style={{ display: "flex", gap: 6 }}>
                        <select className="select" value={rotationAgentDraft} onChange={(e) => setRotationAgentDraft(e.target.value)}>
                          <option value="">Add broker...</option>
                          {agentsList.filter((a) => !brokerRotation.includes(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <button className="stage-btn active" onClick={() => { addToRotation(rotationAgentDraft); setRotationAgentDraft(""); }}>+ Add</button>
                      </div>
                    </div>
                    {brokerRotation.map((agentId, i) => {
                      const allocs = leadAllocations.filter((a) => a.agentId === agentId);
                      const lastAlloc = allocs[0];
                      const isNext = i === (rotationCursor % brokerRotation.length);
                      return (
                        <div key={agentId} className="canvas-leader-row" style={isNext ? { background: "var(--brass-wash)", borderRadius: 8, padding: "4px 6px" } : {}}>
                          <span className="rank-badge" style={{ width: 24, height: 24, fontSize: 11 }}>{i + 1}</span>
                          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{agentName(agentId)}</span>
                          <span className="lead-sub">{allocs.length} leads</span>
                          <span className="lead-sub">{lastAlloc ? "Last " + fmtDate(lastAlloc.timestamp) : "Waiting"}</span>
                          <button className="stage-btn danger-text" onClick={() => removeFromRotation(agentId)}>Remove</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="panel" style={{ padding: 16 }}>
                    <h3 className="crm-display" style={{ fontSize: 14, margin: "0 0 10px 0" }}>Recent Lead Allocations</h3>
                    {leadAllocations.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "var(--slate)", fontSize: 12.5 }}>
                        <Inbox size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
                        <div style={{ fontWeight: 700 }}>No leads allocated yet</div>
                        <div className="lead-sub">Assign a lead from a campaign above and it'll show here.</div>
                      </div>
                    ) : (
                      leadAllocations.slice(0, 8).map((a) => {
                        const camp = marketingCampaigns.find((c) => c.id === a.campaignId);
                        return (
                          <div key={a.id} className="canvas-leader-row">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{a.leadName}</div>
                              <div className="lead-sub">{agentName(a.agentId)} · {camp ? camp.name : "—"} · {fmtDate(a.timestamp)}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {addBudgetOpen && (
                  <div className="drawer-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={() => setAddBudgetOpen(false)}>
                    <div className="register-confirm-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="drawer-head" style={{ padding: "16px 18px" }}>
                        <h1 className="crm-display" style={{ fontSize: 16 }}>Add Budget</h1>
                        <button className="drawer-close" onClick={() => setAddBudgetOpen(false)}><X size={18} /></button>
                      </div>
                      <div style={{ padding: "0 18px 18px 18px" }}>
                        <div className="field-label" style={{ marginTop: 0 }}>Name</div>
                        <input type="text" className="req-input" value={budgetFormDraft.name} onChange={(e) => setBudgetFormDraft((d) => ({ ...d, name: e.target.value }))} />
                        <div className="req-grid-2">
                          <div>
                            <div className="field-label">Platform</div>
                            <select className="req-input" value={budgetFormDraft.platform} onChange={(e) => setBudgetFormDraft((d) => ({ ...d, platform: e.target.value }))}>
                              {MARKETING_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="field-label">Sector</div>
                            <select className="req-input" value={budgetFormDraft.sector} onChange={(e) => setBudgetFormDraft((d) => ({ ...d, sector: e.target.value }))}>
                              {MARKETING_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="req-grid-2">
                          <div>
                            <div className="field-label">Start date</div>
                            <input type="date" className="req-input" value={budgetFormDraft.startDate} onChange={(e) => setBudgetFormDraft((d) => ({ ...d, startDate: e.target.value }))} />
                          </div>
                          <div>
                            <div className="field-label">End date</div>
                            <input type="date" className="req-input" value={budgetFormDraft.endDate} onChange={(e) => setBudgetFormDraft((d) => ({ ...d, endDate: e.target.value }))} />
                          </div>
                        </div>
                        <div className="field-label">Budget (R)</div>
                        <input type="number" className="req-input" value={budgetFormDraft.budget} onChange={(e) => setBudgetFormDraft((d) => ({ ...d, budget: e.target.value }))} />
                        <button className="stage-btn active" style={{ marginTop: 12, width: "100%" }} onClick={addMarketingBudget}>Add Budget</button>
                      </div>
                    </div>
                  </div>
                )}

                {addCampaignOpen && (
                  <div className="drawer-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={() => { setAddCampaignOpen(false); setEditCampaignId(null); }}>
                    <div className="register-confirm-modal" style={{ maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                      <div className="drawer-head" style={{ padding: "16px 18px" }}>
                        <h1 className="crm-display" style={{ fontSize: 16 }}>{editCampaignId ? "Edit Campaign" : "Add Campaign"}</h1>
                        <button className="drawer-close" onClick={() => { setAddCampaignOpen(false); setEditCampaignId(null); }}><X size={18} /></button>
                      </div>
                      <div style={{ padding: "0 18px 18px 18px" }}>
                        <div className="field-label" style={{ marginTop: 0 }}>Name</div>
                        <input type="text" className="req-input" value={campaignFormDraft.name} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, name: e.target.value }))} />
                        <div className="field-label">Budget pool</div>
                        <select className="req-input" value={campaignFormDraft.budgetId} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, budgetId: e.target.value }))}>
                          <option value="">Choose budget...</option>
                          {marketingBudgets.filter((b) => !b.archived).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <div className="req-grid-2">
                          <div>
                            <div className="field-label">Platform</div>
                            <select className="req-input" value={campaignFormDraft.platform} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, platform: e.target.value }))}>
                              {MARKETING_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="field-label">Sector</div>
                            <select className="req-input" value={campaignFormDraft.sector} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, sector: e.target.value }))}>
                              {MARKETING_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="req-grid-2">
                          <div>
                            <div className="field-label">Area</div>
                            <select className="req-input" value={campaignFormDraft.area} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, area: e.target.value }))}>
                              {MARKETING_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="field-label">Status</div>
                            <select className="req-input" value={campaignFormDraft.status} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, status: e.target.value }))}>
                              {MARKETING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="req-grid-2">
                          <div>
                            <div className="field-label">Spend to date (R)</div>
                            <input type="number" className="req-input" value={campaignFormDraft.spend} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, spend: e.target.value }))} />
                          </div>
                          <div>
                            <div className="field-label">Allocation (R)</div>
                            <input type="number" className="req-input" value={campaignFormDraft.allocation} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, allocation: e.target.value }))} />
                          </div>
                        </div>
                        <div className="req-grid-2">
                          <div>
                            <div className="field-label">Start date</div>
                            <input type="date" className="req-input" value={campaignFormDraft.startDate} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, startDate: e.target.value }))} />
                          </div>
                          <div>
                            <div className="field-label">End date</div>
                            <input type="date" className="req-input" value={campaignFormDraft.endDate} onChange={(e) => setCampaignFormDraft((d) => ({ ...d, endDate: e.target.value }))} />
                          </div>
                        </div>
                        <div className="field-label">Brokers on this campaign</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {agentsList.map((a) => {
                            const active = campaignFormDraft.brokers.includes(a.id);
                            return (
                              <button
                                key={a.id}
                                className={"quick-note-chip " + (active ? "active" : "")}
                                style={active ? { background: "var(--brass-wash)", borderColor: "var(--brass-light)" } : {}}
                                onClick={() => setCampaignFormDraft((d) => ({ ...d, brokers: active ? d.brokers.filter((id) => id !== a.id) : [...d.brokers, a.id] }))}
                              >
                                {a.name}
                              </button>
                            );
                          })}
                        </div>
                        <button className="stage-btn active" style={{ marginTop: 14, width: "100%" }} onClick={saveCampaign}>{editCampaignId ? "Save Changes" : "Add Campaign"}</button>
                      </div>
                    </div>
                  </div>
                )}

                {assignLeadCampaignId && (
                  <div className="drawer-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={() => setAssignLeadCampaignId(null)}>
                    <div className="register-confirm-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="drawer-head" style={{ padding: "16px 18px" }}>
                        <h1 className="crm-display" style={{ fontSize: 16 }}>Assign Lead</h1>
                        <button className="drawer-close" onClick={() => setAssignLeadCampaignId(null)}><X size={18} /></button>
                      </div>
                      <div style={{ padding: "0 18px 18px 18px" }}>
                        <div className="field-label" style={{ marginTop: 0 }}>Lead name</div>
                        <input type="text" className="req-input" value={assignLeadDraft.name} onChange={(e) => setAssignLeadDraft((d) => ({ ...d, name: e.target.value }))} />
                        <div className="field-label">Phone</div>
                        <input type="text" className="req-input" value={assignLeadDraft.phone} onChange={(e) => setAssignLeadDraft((d) => ({ ...d, phone: e.target.value }))} />
                        <div className="field-label">Email</div>
                        <input type="text" className="req-input" value={assignLeadDraft.email} onChange={(e) => setAssignLeadDraft((d) => ({ ...d, email: e.target.value }))} />
                        <div className="field-label">Assign to</div>
                        <select className="req-input" value={assignLeadDraft.agent} onChange={(e) => setAssignLeadDraft((d) => ({ ...d, agent: e.target.value }))}>
                          {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            className="stage-btn active" style={{ flex: 1 }}
                            onClick={() => { assignCampaignLead(assignLeadCampaignId, assignLeadDraft.agent, assignLeadDraft.name, assignLeadDraft.phone, assignLeadDraft.email); setAssignLeadCampaignId(null); }}
                          >
                            Assign to Selected
                          </button>
                          <button
                            className="stage-btn" style={{ flex: 1 }}
                            onClick={() => { assignNextRoundRobin(assignLeadCampaignId, assignLeadDraft.name, assignLeadDraft.phone, assignLeadDraft.email); setAssignLeadCampaignId(null); }}
                          >
                            Assign via Rotation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {nav === "accesscontrol" && currentRole === "masterAdmin" && (
            <>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 18 }}>
                <ShieldCheck size={12} /> Master Admins ({MASTER_ADMINS.join(" & ")}) always see everything — this page controls what Office Managers and Agents can access.
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Agents</h3>
                <button className="stage-btn active" onClick={() => setAddAgentOpen((v) => !v)}>
                  {addAgentOpen ? "Cancel" : "+ Add agent"}
                </button>
              </div>
              {addAgentOpen && (
                <div className="panel" style={{ marginBottom: 12, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input className="req-input" placeholder="Full name" value={agentFormDraft.name}
                      onChange={(e) => setAgentFormDraft((p) => ({ ...p, name: e.target.value }))} />
                    <input className="req-input" placeholder="Initials (optional)" value={agentFormDraft.initials}
                      onChange={(e) => setAgentFormDraft((p) => ({ ...p, initials: e.target.value }))} />
                    <input className="req-input" placeholder="Title" value={agentFormDraft.title}
                      onChange={(e) => setAgentFormDraft((p) => ({ ...p, title: e.target.value }))} />
                    <select className="select" value={agentFormDraft.tier}
                      onChange={(e) => setAgentFormDraft((p) => ({ ...p, tier: e.target.value }))}>
                      <option value="Yellow">Yellow</option>
                      <option value="Blue">Blue</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                    </select>
                    <input className="req-input" placeholder="Cell number" value={agentFormDraft.cell}
                      onChange={(e) => setAgentFormDraft((p) => ({ ...p, cell: e.target.value }))} />
                    <input className="req-input" placeholder="Email address" type="email" value={agentFormDraft.email}
                      onChange={(e) => setAgentFormDraft((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <button className="stage-btn active" style={{ marginTop: 10 }} onClick={handleAddAgent}>Add agent</button>
                </div>
              )}
              <div className="panel" style={{ marginBottom: 24 }}>
                {agentsList.map((a) => (
                  <div
                    className="access-row"
                    key={a.id}
                    style={{ gap: 10, alignItems: "center", flexWrap: "wrap", cursor: "default", opacity: a.active === false ? 0.55 : 1 }}
                  >
                    <label style={{ cursor: "pointer" }}>
                      {a.photoUrl
                        ? <img src={a.photoUrl} alt={a.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                        : <span className="agent-avatar-sm">{a.initials}</span>}
                      <input type="file" accept="image/*" style={{ display: "none" }}
                        onChange={(e) => handleUploadAgentPhoto(a.id, e.target.files?.[0])} />
                    </label>
                    <span className="access-row-name" style={{ flex: "0 1 130px", minWidth: 90 }}>
                      {a.name}
                      {a.active === false && <span className="badge" style={{ marginLeft: 6, fontSize: 10 }}>Inactive</span>}
                    </span>
                    <input className="req-input" style={{ marginTop: 0, width: 110 }} placeholder="Title" value={a.title || ""}
                      onChange={(e) => handleUpdateAgentField(a.id, "title", e.target.value)} />
                    <input className="req-input" style={{ marginTop: 0, width: 120 }} placeholder="Cell" value={a.cell || ""}
                      onChange={(e) => handleUpdateAgentField(a.id, "cell", e.target.value)} />
                    <input className="req-input" style={{ marginTop: 0, width: 160 }} placeholder="Email" type="email" value={a.email || ""}
                      onChange={(e) => handleUpdateAgentField(a.id, "email", e.target.value)} />
                    <select className="select" value={a.tier || "Yellow"} onChange={(e) => handleSetAgentTier(a.id, e.target.value)}>
                      <option value="Yellow">Yellow</option>
                      <option value="Blue">Blue</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                    </select>
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                      <button
                        className="stage-btn"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => handleSetAgentActive(a.id, a.active === false)}
                        title={a.active === false ? "Reactivate — restores their login" : "Deactivate — revokes their login, keeps their data"}
                      >
                        {a.active === false ? "Reactivate" : "Deactivate"}
                      </button>
                      <button className="drawer-close" onClick={() => handleRemoveAgent(a.id)} title="Permanently delete agent"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 24 }}>
                <Info size={12} /> Status (Yellow/Blue/Silver/Gold) can only be changed here by Master Admin. New offers and deals for an agent are stamped with their status at the moment they're created — changing an agent's status only affects deals created after the change, existing deals keep whatever status they were created under. Deactivating an agent revokes their login but keeps all their data and leaderboard history intact; deleting an agent is permanent.
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Invite a new user</h3>
              </div>
              <div className="panel" style={{ marginBottom: 12, padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 8, alignItems: "start" }}>
                  <input className="req-input" style={{ marginTop: 0 }} type="email" placeholder="email@address.com"
                    value={inviteDraft.email} onChange={(e) => setInviteDraft((p) => ({ ...p, email: e.target.value }))} />
                  <select className="select" value={inviteDraft.role} onChange={(e) => setInviteDraft((p) => ({ ...p, role: e.target.value }))}>
                    <option value="agent">Agent</option>
                    <option value="officeManager">Office Manager</option>
                    <option value="officeAdmin">Office Admin</option>
                    <option value="marketing">Marketing</option>
                    <option value="masterAdmin">Master Admin</option>
                  </select>
                  {inviteDraft.role !== "masterAdmin" && inviteDraft.role !== "marketing" ? (
                    <select className="select" value={inviteDraft.agentId} onChange={(e) => setInviteDraft((p) => ({ ...p, agentId: e.target.value }))}>
                      <option value="">Link to agent…</option>
                      {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      <option value={ADMIN_AGENT_ID}>{ADMIN_AGENT.name}</option>
                    </select>
                  ) : <div />}
                  <button className="stage-btn active" onClick={handleInviteUser}>Send invite</button>
                </div>
                {inviteStatus && (
                  <div className="req-note" style={{ marginBottom: 0, marginTop: 10, color: inviteStatus.ok ? "inherit" : "#b3261e" }}>
                    {inviteStatus.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {inviteStatus.message}
                  </div>
                )}
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 24 }}>
                <Info size={12} /> Sends a real Supabase invite email with a sign-in link — the account and role are both created immediately, no separate approval step needed. Requires the invite-user Edge Function to be deployed (see setup notes).
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Pending user accounts</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Accounts that exist in Supabase Auth but aren't linked to a role yet — normally only happens if someone was created directly in the Supabase dashboard instead of invited above.
              </div>
              <div className="panel" style={{ marginBottom: 24 }}>
                {pendingUsers.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "#888" }}>No accounts waiting for approval.</div>}
                {pendingUsers.map((u) => (
                  <PendingUserRow key={u.id} user={u} onApprove={handleApproveUser} onDelete={handleDeleteUserAccount} agents={agentsList} />
                ))}
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Linked users</h3>
              </div>
              <div className="panel" style={{ marginBottom: 24 }}>
                {linkedProfiles.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "#888" }}>No linked users yet.</div>}
                {linkedProfiles.map((p) => (
                  <LinkedUserRow key={p.id} profile={p} onChange={handleChangeUserRole} onDelete={handleDeleteUserAccount} onResetPassword={handleAdminResetPassword} agents={agentsList} />
                ))}
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>My sidebar</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Master Admin always has full access underneath — unchecking something here only hides it from your own sidebar to declutter it. It's stored in this browser, doesn't affect what anyone else sees, and you can turn anything back on anytime.
              </div>
              <div className="panel" style={{ marginBottom: 24, padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                  {NAV_SECTIONS.map((s) => (
                    <label key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", cursor: "pointer" }}>
                      <input type="checkbox" checked={!myHiddenNav.includes(s.key)} onChange={() => toggleMyHiddenNav(s.key)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Preview navigation by role</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> This shows which sidebar sections a role can open — it does <strong>not</strong> preview which rows of data they'd see. Row-level access (which leads/offers/deals a given agent can read) is enforced server-side by Supabase for their real login, and can only be verified by actually signing in as that account — this preview can't simulate that from inside your own Master Admin session.
              </div>
              <div className="panel" style={{ marginBottom: 24, padding: 14 }}>
                <select className="select" value={previewRole} onChange={(e) => setPreviewRole(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="officeManager">Office Manager</option>
                  <option value="agent">Agent</option>
                  <option value="officeAdmin">Office Admin</option>
                  <option value="marketing">Marketing</option>
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                  {NAV_SECTIONS.map((s) => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}>
                      {navAccessForRole(previewRole, s.key)
                        ? <CheckCircle2 size={14} color="var(--sage, #3E6B3F)" />
                        : <Circle size={14} color="var(--slate, #8B8D98)" />}
                      <span style={{ color: navAccessForRole(previewRole, s.key) ? "inherit" : "#999" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>What each role can access</h3>
              </div>
              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Master Admin</th>
                      <th>Office Manager</th>
                      <th>Agent</th>
                      <th>Office Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NAV_SECTIONS.map((s) => (
                      <tr key={s.key}>
                        <td>{s.label}</td>
                        <td className="pt-count"><input type="checkbox" checked disabled /></td>
                        <td className="pt-count">
                          <input
                            type="checkbox"
                            checked={!!rolePermissions.officeManager[s.key]}
                            onChange={() => togglePermission("officeManager", s.key)}
                          />
                        </td>
                        <td className="pt-count">
                          <input
                            type="checkbox"
                            checked={!!rolePermissions.agent[s.key]}
                            onChange={() => togglePermission("agent", s.key)}
                          />
                        </td>
                        <td className="pt-count">
                          <input
                            type="checkbox"
                            checked={!!rolePermissions.officeAdmin?.[s.key]}
                            onChange={() => togglePermission("officeAdmin", s.key)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="req-note" style={{ marginBottom: 24 }}>
                <Info size={12} /> Agents only ever see their own leads, pipeline, canvassing, and deals regardless of these checkboxes — this table controls which sections of the app they can open at all, not whose data shows up inside them. Office Admin is tied directly to the Admin Agent identity — wherever it has Deals access, only the OTP Sent status is ever editable, and the Deals list is automatically filtered to only what still needs an Offer to Purchase sent.
              </div>

              <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
                <h3>Deal columns visible per role</h3>
              </div>
              <div className="req-note" style={{ marginTop: 0, marginBottom: 12 }}>
                <Info size={12} /> Unticking a column here hides it for that role everywhere the Deals table appears — they won't see it in "Customize columns" either, so it can't be turned back on from their side. Agent and Property always stay visible to everyone.
              </div>
              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Master Admin</th>
                      <th>Office Manager</th>
                      <th>Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEAL_COLUMNS.map((c) => (
                      <tr key={c.key}>
                        <td>{c.label}</td>
                        <td className="pt-count"><input type="checkbox" checked disabled /></td>
                        <td className="pt-count">
                          <input
                            type="checkbox"
                            checked={!roleHiddenColumns.officeManager.includes(c.key)}
                            onChange={() => toggleRoleColumn("officeManager", c.key)}
                          />
                        </td>
                        <td className="pt-count">
                          <input
                            type="checkbox"
                            checked={!roleHiddenColumns.agent.includes(c.key)}
                            onChange={() => toggleRoleColumn("agent", c.key)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Drawer */}
        {selectedLead && (
          <div className="drawer-overlay" onClick={() => setSelectedLead(null)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">{SOURCES[selectedLead.source].label}</div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{selectedLead.name}</h1>
                </div>
                <button className="drawer-close" onClick={() => setSelectedLead(null)}><X size={18} /></button>
              </div>

              <div className="action-row">
                <a className="action-btn wa" href={buildWhatsappLink(selectedLead)} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a className="action-btn ol" href={buildOutlookLink(selectedLead)} target="_blank" rel="noreferrer">
                  <CalendarPlus size={14} /> Book viewing in Outlook
                </a>
              </div>

              <div className="drawer-tabs">
                <button className={"drawer-tab " + (drawerTab === "enquiry" ? "active" : "")} onClick={() => setDrawerTab("enquiry")}>Enquiry</button>
                <button className={"drawer-tab " + (drawerTab === "requirements" ? "active" : "")} onClick={() => setDrawerTab("requirements")}>Buyer profile</button>
                <button className={"drawer-tab " + (drawerTab === "notes" ? "active" : "")} onClick={() => setDrawerTab("notes")}>Notes</button>
              </div>

              <div className="drawer-body">
                {drawerTab === "enquiry" && (
                  <>
                    <div className="field-label">Contact</div>
                    <div className="field-value"><Phone size={13} /> {selectedLead.phone}</div>
                    <div className="field-value" style={{ marginTop: 4 }}><Mail size={13} /> {selectedLead.email}</div>

                    <div className="field-label">Enquired about</div>
                    <div className="field-value">{selectedLead.listingAddress}</div>
                    <div className="lead-sub crm-mono">{selectedLead.listingRef} · {fmtPrice(selectedLead.price)}</div>

                    <div className="field-label">Message</div>
                    <div className="msg-box">{selectedLead.message}</div>

                    <div className="field-label">Stage</div>
                    <div className="stage-btns">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          className={"stage-btn " + (selectedLead.status === s ? "active" : "")}
                          onClick={() => updateStatus(selectedLead.id, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="field-label">Assigned agent (owner)</div>
                    <select
                      className="agent-select"
                      value={selectedLead.agent}
                      onChange={(e) => assignAgent(selectedLead.id, e.target.value)}
                    >
                      {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    <div className="field-label">Also visible to</div>
                    <div className="collab-list">
                      {agentsList.filter((a) => a.id !== selectedLead.agent).map((a) => {
                        const active = selectedLead.collaborators.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            className={"collab-chip " + (active ? "active" : "")}
                            onClick={() => toggleCollaborator(selectedLead.id, a.id)}
                          >
                            {active ? <CheckCircle2 size={12} /> : <UserPlus size={12} />} {a.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="field-label">Received</div>
                    <div className="field-value">{fmtDate(selectedLead.date)}</div>
                  </>
                )}

                {drawerTab === "requirements" && (
                  <ReqForm lead={selectedLead} onChange={updateRequirements} />
                )}

                {drawerTab === "notes" && (
                  <>
                    <div className="field-label" style={{ marginTop: 0 }}>Log a note</div>
                    <select
                      className="req-input"
                      value={noteDraft.type}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, type: e.target.value }))}
                    >
                      {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {(noteDraft.type === "Viewing Booked" || noteDraft.type === "Viewing Feedback") && (
                      <select
                        className="req-input"
                        style={{ marginTop: 8 }}
                        value={noteDraft.listingRef}
                        onChange={(e) => setNoteDraft((d) => ({ ...d, listingRef: e.target.value }))}
                      >
                        <option value="">Select property...</option>
                        {listingsData.map((l) => <option key={l.ref} value={l.ref}>{l.address}, {l.suburb}</option>)}
                      </select>
                    )}

                    <textarea
                      className="req-input note-textarea"
                      style={{ marginTop: 8 }}
                      placeholder={noteDraft.type === "Viewing Booked" ? "Optional details (time, who's attending)..." : "What happened / what was said..."}
                      value={noteDraft.text}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, text: e.target.value }))}
                    />
                    <button
                      className="stage-btn active"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        addNote(selectedLead.id, noteDraft);
                        setNoteDraft({ type: noteDraft.type, text: "", listingRef: "", viewingDate: "" });
                      }}
                    >
                      Log note
                    </button>

                    <div className="req-divider"><ArrowRight size={13} /> Follow up</div>
                    <select
                      className="req-input"
                      value={followUpDraft.reason}
                      onChange={(e) => setFollowUpDraft((d) => ({ ...d, reason: e.target.value }))}
                    >
                      {FOLLOWUP_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <textarea
                      className="req-input note-textarea"
                      style={{ marginTop: 8, minHeight: 50 }}
                      placeholder="Optional detail..."
                      value={followUpDraft.text}
                      onChange={(e) => setFollowUpDraft((d) => ({ ...d, text: e.target.value }))}
                    />
                    <button
                      className="stage-btn"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        addFollowUp(selectedLead.id, followUpDraft.reason, followUpDraft.text);
                        setFollowUpDraft({ reason: followUpDraft.reason, text: "" });
                      }}
                    >
                      Create follow-up + add to my to-dos
                    </button>

                    <div className="req-divider"><ClipboardList size={13} /> Activity ({(selectedLead.activity || []).length})</div>
                    <div className="timeline">
                      {[...(selectedLead.activity || [])].sort((a, b) => b.timestamp - a.timestamp).map((entry) => (
                        <div className="timeline-item" key={entry.id}>
                          <span className={"badge note-type" + entry.type.replace(/[^A-Za-z]/g, "")}>{entry.type}</span>
                          <div className="timeline-text">{entry.text}</div>
                          <div className="timeline-meta">
                            {entry.author ? agentName(entry.author) + " · " : ""}{fmtDate(entry.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Area Canvas Record drawer */}
        {addCanvasOpen && (
          <div className="drawer-overlay" onClick={() => { setAddCanvasOpen(false); setEditCanvasId(null); }}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{editCanvasId ? "Edit Area Canvas Record" : "Add Area Canvas Record"}</h1>
                </div>
                <button className="drawer-close" onClick={() => { setAddCanvasOpen(false); setEditCanvasId(null); }}><X size={18} /></button>
              </div>
              <div className="drawer-body">
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Address</div>
                    <input type="text" className="req-input" value={canvasFormDraft.address} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, address: e.target.value }))} />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Suburb</div>
                    <input type="text" className="req-input" value={canvasFormDraft.suburb} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, suburb: e.target.value }))} />
                  </div>
                </div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Current Marketing Price</div>
                    <input type="number" className="req-input" placeholder="If applicable" value={canvasFormDraft.sellPrice} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, sellPrice: e.target.value }))} />
                  </div>
                  <div>
                    <div className="field-label">Name</div>
                    <input type="text" className="req-input" placeholder="Optional" value={canvasFormDraft.ownerName} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, ownerName: e.target.value }))} />
                  </div>
                </div>
                <div className="field-label">Current Marketing Link</div>
                <input type="text" className="req-input" placeholder="e.g. Private Property or Property24 listing URL" value={canvasFormDraft.marketingLink} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, marketingLink: e.target.value }))} />
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Contact Details</div>
                    <input type="text" className="req-input" placeholder="Phone number" value={canvasFormDraft.ownerPhone} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, ownerPhone: e.target.value }))} />
                  </div>
                  <div>
                    <div className="field-label">Email / Contact Details</div>
                    <input type="text" className="req-input" value={canvasFormDraft.emailContactDetails} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, emailContactDetails: e.target.value }))} />
                  </div>
                </div>
                <div className="field-label">Follow-up date/time</div>
                <input type="date" className="req-input" value={canvasFormDraft.followUpDate} onChange={(e) => setCanvasFormDraft((d) => ({ ...d, followUpDate: e.target.value }))} />

                {!editCanvasId && (
                  <div className="req-note">
                    <Info size={12} /> If this address or contact number already exists, it won't be added again — duplicates are checked automatically.
                  </div>
                )}
                {editCanvasId && doorKnocks.find((d) => d.id === editCanvasId)?.status === "Number Requested" && (
                  <div className="req-note">
                    <Info size={12} /> Nothing else here is mandatory. If you found a number, fill it in and click "Info Sent to Agent" — that hands it back to the broker to call. If nothing could be found, click "No Info" instead — the record stays on file under Contacts either way.
                  </div>
                )}

                {editCanvasId && doorKnocks.find((d) => d.id === editCanvasId)?.status === "Number Requested" ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                      className="stage-btn active"
                      style={{ flex: 1 }}
                      onClick={() => {
                        if (!canvasFormDraft.ownerPhone.trim()) {
                          window.alert("Add a phone number before marking this sent — that's what hands it back to the broker to call. If you couldn't find one, use \u201cNo Info\u201d instead.");
                          return;
                        }
                        saveDKEdit(editCanvasId, canvasFormDraft);
                        setAddCanvasOpen(false);
                        setEditCanvasId(null);
                      }}
                    >
                      Info Sent to Agent
                    </button>
                    <button
                      className="stage-btn danger-text"
                      style={{ flex: 1 }}
                      onClick={() => {
                        markNoInfoFound(editCanvasId);
                        setAddCanvasOpen(false);
                        setEditCanvasId(null);
                      }}
                    >
                      No Info
                    </button>
                  </div>
                ) : (
                  <button
                    className="stage-btn active"
                    style={{ marginTop: 14, width: "100%" }}
                    onClick={() => {
                      if (editCanvasId) {
                        saveDKEdit(editCanvasId, canvasFormDraft);
                        setAddCanvasOpen(false);
                        setEditCanvasId(null);
                      } else {
                        const ok = addManualCanvasRecord(canvasFormDraft);
                        if (ok) {
                          setAddCanvasOpen(false);
                          setCanvasFormDraft({ address: "", suburb: "", sellPrice: "", marketingLink: "", ownerName: "", ownerPhone: "", emailContactDetails: "", followUpDate: "" });
                        }
                      }
                    }}
                  >
                    {editCanvasId ? "Save Changes" : "Add Record"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Door-knock drawer */}
        {selectedDK && (
          <div className="drawer-overlay" onClick={() => setSelectedDK(null)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">Door knock · {selectedDK.suburb}</div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{selectedDK.address}</h1>
                </div>
                <button className="drawer-close" onClick={() => setSelectedDK(null)}><X size={18} /></button>
              </div>

              <div className="drawer-body">
                <div className="field-label" style={{ marginTop: 0 }}>Owner</div>
                <div className="field-value">{selectedDK.ownerName}</div>
                <div className="field-value" style={{ marginTop: 4 }}><Phone size={13} /> {selectedDK.ownerPhone}</div>

                <div className="field-label">Knocked by</div>
                <div className="field-value">{agentName(selectedDK.agent)} · {fmtDate(selectedDK.date)}</div>

                <div className="field-label">Status</div>
                <div className="stage-btns">
                  {DK_STATUSES.map((s) => (
                    <button
                      key={s}
                      className={"stage-btn " + (selectedDK.status === s ? "active" : "")}
                      onClick={() => setDKStatus(selectedDK.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="field-label">Follow-up date</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="date"
                    className="req-input"
                    value={dkFollowUpDraft}
                    onChange={(e) => setDkFollowUpDraft(e.target.value)}
                  />
                  <button className="stage-btn active" onClick={() => setDKFollowUp(selectedDK.id, dkFollowUpDraft)}>Set</button>
                </div>
                <div className="lead-sub" style={{ marginTop: 6 }}>Currently: {fmtDate(selectedDK.followUpDate)}</div>

                <div className="req-divider"><ClipboardList size={13} /> Notes ({selectedDK.notes.length})</div>
                <textarea
                  className="req-input note-textarea"
                  placeholder="What happened at the door..."
                  value={dkNoteDraft}
                  onChange={(e) => setDkNoteDraft(e.target.value)}
                />
                <button
                  className="stage-btn active"
                  style={{ marginTop: 8 }}
                  onClick={() => { addDKNote(selectedDK.id, dkNoteDraft); setDkNoteDraft(""); }}
                >
                  Log note
                </button>

                <div className="timeline" style={{ marginTop: 10 }}>
                  {[...selectedDK.notes].sort((a, b) => b.date - a.date).map((n) => (
                    <div className="timeline-item" key={n.id}>
                      <div className="timeline-text">{n.text}</div>
                      <div className="timeline-meta">{n.author ? agentName(n.author) + " · " : ""}{fmtDate(n.date)}</div>
                    </div>
                  ))}
                </div>

                <div className="req-divider"><DollarSign size={13} /> Valuation</div>
                {selectedDK.valuation ? (
                  <div className="valuation-card">
                    <div className="listing-price">{fmtPrice(selectedDK.valuation.price)}</div>
                    <div className="lead-sub">By {agentName(selectedDK.valuation.agent)} · {fmtDate(selectedDK.valuation.date)}</div>
                    {selectedDK.valuation.pdfName && (
                      <div className="lead-sub" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <FileText size={12} /> {selectedDK.valuation.pdfName}
                      </div>
                    )}
                    {selectedDK.status !== "Converted to Listing" ? (
                      <button className="stage-btn active" style={{ marginTop: 10 }} onClick={() => convertDKToListing(selectedDK)}>
                        Convert to listing
                      </button>
                    ) : (
                      <div className="req-note" style={{ marginTop: 10 }}>
                        <CheckCircle2 size={12} /> Converted — now live under Listings.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="field-label" style={{ marginTop: 0 }}>Date of valuation</div>
                    <input
                      type="date"
                      className="req-input"
                      value={valuationDraft.date}
                      onChange={(e) => setValuationDraft((v) => ({ ...v, date: e.target.value }))}
                    />
                    <div className="field-label">Carried out by</div>
                    <select
                      className="req-input"
                      value={valuationDraft.agent}
                      onChange={(e) => setValuationDraft((v) => ({ ...v, agent: e.target.value }))}
                    >
                      {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <div className="field-label">Price</div>
                    <div className="req-input-wrap crm-mono">
                      <span>R</span>
                      <MoneyInput
                        className="req-input"
                        value={valuationDraft.price}
                        onChange={(e) => setValuationDraft((v) => ({ ...v, price: e.target.value }))}
                      />
                    </div>
                    <div className="field-label">Valuation report (PDF)</div>
                    <label className="file-input-label">
                      <Upload size={13} />
                      {valuationDraft.pdfName || "Choose PDF..."}
                      <input
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={(e) => setValuationDraft((v) => ({ ...v, pdfName: e.target.files[0]?.name || "" }))}
                      />
                    </label>
                    <button className="stage-btn active" style={{ marginTop: 10 }} onClick={() => saveValuation(selectedDK.id)}>
                      Save valuation
                    </button>
                    <div className="req-note">
                      <Info size={12} /> The PDF stays attached in this session for the prototype. Persisting the actual file needs a document store (e.g. SharePoint/S3) behind the scenes.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact detail drawer — who they are plus a timestamped history
            of every offer/deal they've been party to, across every agent,
            so a repeat buyer/seller (or one who offered years ago and
            never bought, now selling) is easy to spot. */}
        {contactDetail && (
          <div className="drawer-overlay" onClick={() => setContactDetailId(null)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">{contactDetail.category || "Contact"}</div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{contactDetail.name}</h1>
                </div>
                <button className="drawer-close" onClick={() => setContactDetailId(null)}><X size={18} /></button>
              </div>
              <div className="drawer-body">
                <div className="field-label" style={{ marginTop: 0 }}>Cell</div>
                <div className="field-value">{contactDetail.phone || "—"}</div>
                <div className="field-label">Email</div>
                <div className="field-value">{contactDetail.email || "—"}</div>

                <div className="req-divider"><ClipboardList size={13} /> History ({contactHistory.length})</div>
                {contactHistory.length === 0 ? (
                  <div className="req-note">No offers or deals linked to this contact yet.</div>
                ) : (
                  contactHistory.map((h) => (
                    <div className="contact-history-row" key={h.id}>
                      <div className="contact-history-date">{h.date ? fmtDate(h.date) : "—"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{h.property || "Untitled"}</div>
                        <div className="lead-sub">{h.role} · {h.agentLabel} · {h.kind}</div>
                      </div>
                      <span className={"badge " + (h.status === "Registered" || h.status === "Completed" ? "cond-confirmed" : h.status === "No deal" ? "offer-no" : "status-badge")}>{h.status}</span>
                      <button
                        className="stage-btn"
                        onClick={() => {
                          setContactDetailId(null);
                          if (h.openDeal) { setDealDrawerId(h.openDeal); setNav("deals"); }
                          else if (h.openOffer) { openOfferDrawer(h.openOffer); setNav("offers"); }
                          else if (h.openRentalDeal) { setActiveVertical("rentals"); setRentalDealDrawerId(h.openRentalDeal); setNav("rentaldeals"); }
                          else if (h.openRentalOffer) { setActiveVertical("rentals"); setRentalOfferDrawerId(h.openRentalOffer); setNav("rentaloffers"); }
                        }}
                      >
                        Open
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deal drawer — Purchaser/Seller, extra transaction terms, and the
            suspensive conditions checklist. The main Deals list is a flat
            summary row (Kyle's design); everything else lives in here. */}
        {dealDrawer && (() => {
          const d = dealDrawer;
          const calc = computeDealCommission(d);
          const rowLocked = currentRole === "agent" || (currentRole === "officeAdmin" && currentAgentId === ADMIN_AGENT_ID);
          const detailColumns = visibleColumns.filter((c) => c.key !== "otpStatus" && c.key !== "transferProgress");
          return (
            <div className="drawer-overlay" onClick={() => setDealDrawerId(null)}>
              <div className="drawer transfer-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-head">
                  <div>
                    <div className="topbar-eyebrow">Deal</div>
                    <h1 className="crm-display" style={{ fontSize: 18 }}>{d.property || "Untitled deal"}</h1>
                  </div>
                  <button className="drawer-close" onClick={() => setDealDrawerId(null)}><X size={18} /></button>
                </div>
                <div className="drawer-body">
                  <div className="deal-card-contacts">
                    <div className="deal-field">
                      <label>Purchaser</label>
                      <ContactPicker
                        roleLabel="Purchaser" nameValue={d.buyerName} contactId={d.buyerContactId}
                        contacts={manualContacts} disabled={rowLocked}
                        onChangeName={(v) => updateDeal(d.id, "buyerName", v)}
                        onLink={(c) => { updateDeal(d.id, "buyerName", c.name); updateDeal(d.id, "buyerContactId", c.id); }}
                        onUnlink={() => updateDeal(d.id, "buyerContactId", "")}
                        onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                      />
                    </div>
                    <div className="deal-field">
                      <label>Seller</label>
                      <ContactPicker
                        roleLabel="Seller" nameValue={d.sellerName} contactId={d.sellerContactId}
                        contacts={manualContacts} disabled={rowLocked}
                        onChangeName={(v) => updateDeal(d.id, "sellerName", v)}
                        onLink={(c) => { updateDeal(d.id, "sellerName", c.name); updateDeal(d.id, "sellerContactId", c.id); }}
                        onUnlink={() => updateDeal(d.id, "sellerContactId", "")}
                        onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                      />
                    </div>
                  </div>

                  <div className="deal-conditions-block">
                    <div className="deal-conditions-head">
                      <span>Suspensive conditions ({d.conditionRows.length})</span>
                      <button className="link-btn" onClick={() => openAddCondition(d.id)}>+ Add condition</button>
                    </div>
                    {d.conditionRows.length === 0 && addingConditionForDeal !== d.id && (
                      <div className="lead-sub" style={{ padding: "4px 0 10px" }}>No conditions logged yet — the Status field on the deals list still drives commission totals.</div>
                    )}
                    {d.conditionRows.map((c) => (
                      <div className="deal-condition-row" key={c.id}>
                        <span className={"badge " + (c.status === "Fulfilled" ? "cond-confirmed" : c.status === "Waived" ? "status-badge" : "cond-suspensive")}>{c.status}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.condition_type}{c.mandatory === false ? " (optional)" : ""}</div>
                          {c.description && <div className="lead-sub">{c.description}</div>}
                        </div>
                        <input
                          type="text" className="cell-input" placeholder="Responsible party" style={{ maxWidth: 120 }}
                          defaultValue={c.responsible_party || ""}
                          onBlur={(e) => updateDealConditionRow(d.id, c.id, { responsibleParty: e.target.value })}
                        />
                        <input
                          type="date" className="cell-input" style={{ maxWidth: 130 }}
                          value={c.due_date || ""}
                          onChange={(e) => updateDealConditionRow(d.id, c.id, { dueDate: e.target.value })}
                        />
                        <select className="cell-input" style={{ maxWidth: 110 }} value={c.status} onChange={(e) => updateDealConditionRow(d.id, c.id, { status: e.target.value })}>
                          {CONDITION_ROW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="row-remove" onClick={() => removeDealConditionRow(d.id, c.id)}><X size={13} /></button>
                      </div>
                    ))}
                    {addingConditionForDeal === d.id && (
                      <div className="deal-condition-add-form">
                        <select className="req-input" value={conditionDraft.conditionType} onChange={(e) => setConditionDraft((p) => ({ ...p, conditionType: e.target.value }))}>
                          {CONDITION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="text" className="req-input" placeholder="Description (optional)" value={conditionDraft.description} onChange={(e) => setConditionDraft((p) => ({ ...p, description: e.target.value }))} />
                        <input type="text" className="req-input" placeholder="Responsible party" value={conditionDraft.responsibleParty} onChange={(e) => setConditionDraft((p) => ({ ...p, responsibleParty: e.target.value }))} />
                        <input type="date" className="req-input" value={conditionDraft.dueDate} onChange={(e) => setConditionDraft((p) => ({ ...p, dueDate: e.target.value }))} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="stage-btn" onClick={() => setAddingConditionForDeal(null)}>Cancel</button>
                          <button className="stage-btn active" style={{ flex: 1 }} onClick={() => submitAddCondition(d.id)}>Add</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="deal-card-grid">
                    <div className="deal-field">
                      <label>Agent</label>
                      <select className="cell-input" disabled={rowLocked} value={d.agent} onChange={(e) => updateDeal(d.id, "agent", e.target.value)}>
                        {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="deal-field">
                      <label>Property</label>
                      <AddressAutocompleteInput
                        className="cell-input" disabled={rowLocked} value={d.property}
                        onChange={(v) => updateDeal(d.id, "property", v)}
                        onSelectPlace={({ address, suburb }) => {
                          updateDeal(d.id, "property", address);
                          if (suburb) updateDeal(d.id, "suburb", suburb);
                        }}
                      />
                    </div>
                    {detailColumns.map((c) => renderDealCardField(d, c, calc))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rental offer drawer */}
        {rentalOfferDrawer && (
          <div className="drawer-overlay" onClick={() => setRentalOfferDrawerId(null)}>
            <div className="drawer transfer-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">
                    Rental offer
                    {rentalOfferDrawer.dealId && <span className="badge cond-confirmed" style={{ marginLeft: 8 }}>Converted → Deal</span>}
                  </div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{rentalOfferDrawer.property || "Untitled offer"}</h1>
                </div>
                <button className="drawer-close" onClick={() => setRentalOfferDrawerId(null)}><X size={18} /></button>
              </div>
              <div className="drawer-body">
                <div className="field-label" style={{ marginTop: 0 }}>Agent</div>
                <select className="req-input" value={rentalOfferDrawer.agent || ""} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "agent", e.target.value)}>
                  {!rentalAgentsList.some((a) => a.id === rentalOfferDrawer.agent) && <option value="">— select agent —</option>}
                  {rentalAgentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                <div className="req-grid-2" style={{ marginTop: 16 }}>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Landlord</div>
                    <ContactPicker
                      roleLabel="Landlord" nameValue={rentalOfferDrawer.landlordName} contactId={rentalOfferDrawer.landlordContactId}
                      contacts={manualContacts} disabled={!!rentalOfferDrawer.dealId}
                      onChangeName={(v) => updateRentalOffer(rentalOfferDrawer.id, "landlordName", v)}
                      onLink={(c) => { updateRentalOffer(rentalOfferDrawer.id, "landlordName", c.name); updateRentalOffer(rentalOfferDrawer.id, "landlordContactId", c.id); }}
                      onUnlink={() => updateRentalOffer(rentalOfferDrawer.id, "landlordContactId", "")}
                      onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                    />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Tenant</div>
                    <ContactPicker
                      roleLabel="Tenant" nameValue={rentalOfferDrawer.tenantName} contactId={rentalOfferDrawer.tenantContactId}
                      contacts={manualContacts} disabled={!!rentalOfferDrawer.dealId}
                      onChangeName={(v) => updateRentalOffer(rentalOfferDrawer.id, "tenantName", v)}
                      onLink={(c) => { updateRentalOffer(rentalOfferDrawer.id, "tenantName", c.name); updateRentalOffer(rentalOfferDrawer.id, "tenantContactId", c.id); }}
                      onUnlink={() => updateRentalOffer(rentalOfferDrawer.id, "tenantContactId", "")}
                      onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                    />
                  </div>
                </div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Landlord phone</div>
                    <input type="text" className="req-input" disabled={!!rentalOfferDrawer.dealId} value={rentalOfferDrawer.landlordPhone} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "landlordPhone", e.target.value)} />
                  </div>
                  <div>
                    <div className="field-label">Tenant phone</div>
                    <input type="text" className="req-input" disabled={!!rentalOfferDrawer.dealId} value={rentalOfferDrawer.tenantPhone} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "tenantPhone", e.target.value)} />
                  </div>
                </div>

                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Monthly rental</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!rentalOfferDrawer.dealId} value={rentalOfferDrawer.monthlyRental} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "monthlyRental", e.target.value)} /></div>
                  </div>
                  <div>
                    <div className="field-label">Finder's fee (ex VAT)</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!rentalOfferDrawer.dealId} value={rentalOfferDrawer.findersFee} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "findersFee", e.target.value)} /></div>
                  </div>
                </div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Term of lease (months)</div>
                    <input type="number" className="req-input" disabled={!!rentalOfferDrawer.dealId} value={rentalOfferDrawer.termOfLeaseMonths} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "termOfLeaseMonths", e.target.value)} />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>&nbsp;</div>
                    <label className="req-checkbox" style={{ marginTop: 8 }}>
                      <input type="checkbox" disabled={!!rentalOfferDrawer.dealId} checked={!!rentalOfferDrawer.managed} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "managed", e.target.checked)} />
                      Managed
                    </label>
                  </div>
                </div>
                <div className="field-label">Conditions</div>
                <input type="text" className="req-input" disabled={!!rentalOfferDrawer.dealId} value={rentalOfferDrawer.conditions} onChange={(e) => updateRentalOffer(rentalOfferDrawer.id, "conditions", e.target.value)} />

                <div className="field-label">Status</div>
                {rentalOfferDrawer.dealId ? (
                  <button className="badge cond-confirmed offer-converted-btn" onClick={() => setNav("rentaldeals")}>Converted → Deal</button>
                ) : (
                  <div className="stage-btns">
                    {["Pending", "Yes", "No"].map((s) => (
                      <button key={s} className={"stage-btn " + (rentalOfferDrawer.status === s ? "active" : "")} onClick={() => setRentalOfferStatus(rentalOfferDrawer.id, s)}>
                        {s === "Yes" ? "Accepted by Landlord" : s === "No" ? "No Deal" : "Pending"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="req-divider"><ClipboardList size={13} /> Activity ({(rentalOfferDrawer.activity || []).length})</div>
                <div className="timeline">
                  {[...(rentalOfferDrawer.activity || [])].sort((a, b) => b.timestamp - a.timestamp).map((entry) => (
                    <div className="timeline-item" key={entry.id}>
                      <span className="badge note-typeFollowup">{entry.type || "Note"}</span>
                      <div className="timeline-text">{entry.text}</div>
                      <div className="timeline-meta">{fmtDate(entry.timestamp)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rental deal drawer */}
        {rentalDealDrawer && (
          <div className="drawer-overlay" onClick={() => setRentalDealDrawerId(null)}>
            <div className="drawer transfer-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">Rental deal</div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{rentalDealDrawer.property || "Untitled rental"}</h1>
                </div>
                <button className="drawer-close" onClick={() => setRentalDealDrawerId(null)}><X size={18} /></button>
              </div>
              <div className="drawer-body">
                <div className="field-label" style={{ marginTop: 0 }}>Agent</div>
                <select className="req-input" value={rentalDealDrawer.agent || ""} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "agent", e.target.value)}>
                  {!rentalAgentsList.some((a) => a.id === rentalDealDrawer.agent) && <option value="">— select agent —</option>}
                  {rentalAgentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Listing agent</div>
                    <select className="req-input" value={rentalDealDrawer.listingAgent || ""} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "listingAgent", e.target.value)}>
                      {!rentalAgentsList.some((a) => a.id === rentalDealDrawer.listingAgent) && <option value="">— select agent —</option>}
                      {rentalAgentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="field-label">Shared with</div>
                    <select
                      className="req-input" value={rentalDealDrawer.sharedWithAgent}
                      onChange={(e) => { updateRentalDeal(rentalDealDrawer.id, "sharedWithAgent", e.target.value); if (!e.target.value) updateRentalDeal(rentalDealDrawer.id, "sharedSplit", ""); }}
                    >
                      <option value="">— none —</option>
                      {rentalAgentsList.filter((a) => a.id !== rentalDealDrawer.agent).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                {rentalDealDrawer.sharedWithAgent && (
                  <>
                    <div className="field-label">Split</div>
                    <select className="req-input" value={rentalDealDrawer.sharedSplit} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "sharedSplit", e.target.value)}>
                      <option value="">Choose split...</option>
                      {SPLIT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}

                <div className="req-divider"><ClipboardList size={13} /> Parties</div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Landlord</div>
                    <ContactPicker
                      roleLabel="Landlord" nameValue={rentalDealDrawer.landlordName} contactId={rentalDealDrawer.landlordContactId} contacts={manualContacts}
                      onChangeName={(v) => updateRentalDeal(rentalDealDrawer.id, "landlordName", v)}
                      onLink={(c) => { updateRentalDeal(rentalDealDrawer.id, "landlordName", c.name); updateRentalDeal(rentalDealDrawer.id, "landlordContactId", c.id); }}
                      onUnlink={() => updateRentalDeal(rentalDealDrawer.id, "landlordContactId", "")}
                      onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                    />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Tenant</div>
                    <ContactPicker
                      roleLabel="Tenant" nameValue={rentalDealDrawer.tenantName} contactId={rentalDealDrawer.tenantContactId} contacts={manualContacts}
                      onChangeName={(v) => updateRentalDeal(rentalDealDrawer.id, "tenantName", v)}
                      onLink={(c) => { updateRentalDeal(rentalDealDrawer.id, "tenantName", c.name); updateRentalDeal(rentalDealDrawer.id, "tenantContactId", c.id); }}
                      onUnlink={() => updateRentalDeal(rentalDealDrawer.id, "tenantContactId", "")}
                      onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                    />
                  </div>
                </div>

                <div className="req-divider"><DollarSign size={13} /> Financials</div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Monthly rental</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" value={rentalDealDrawer.monthlyRental} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "monthlyRental", e.target.value)} /></div>
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Finder's fee (ex VAT)</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" value={rentalDealDrawer.findersFee} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "findersFee", e.target.value)} /></div>
                  </div>
                </div>
                <label className="req-checkbox">
                  <input type="checkbox" checked={!!rentalDealDrawer.adminFeePaid} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "adminFeePaid", e.target.checked)} />
                  Admin fee paid
                </label>
                <label className="req-checkbox">
                  <input type="checkbox" checked={!!rentalDealDrawer.managed} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "managed", e.target.checked)} />
                  Managed
                </label>
                {rentalDealDrawer.managed && (
                  <>
                    <div className="field-label">Monthly management fee</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" value={rentalDealDrawer.monthlyManagementFee} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "monthlyManagementFee", e.target.value)} /></div>
                    <label className="req-checkbox">
                      <input type="checkbox" checked={!!rentalDealDrawer.monthlyInspections} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "monthlyInspections", e.target.checked)} />
                      Monthly inspections
                    </label>
                  </>
                )}

                <div className="req-divider"><CalendarPlus size={13} /> Lease</div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Term of lease (months)</div>
                    <input type="number" className="req-input" value={rentalDealDrawer.termOfLeaseMonths} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "termOfLeaseMonths", e.target.value)} />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Move-in date</div>
                    <input type="date" className="req-input" value={rentalDealDrawer.moveInDate} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "moveInDate", e.target.value)} />
                  </div>
                </div>
                <label className="req-checkbox">
                  <input type="checkbox" checked={!!rentalDealDrawer.signedLease} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "signedLease", e.target.checked)} />
                  Lease signed
                </label>

                <div className="field-label">Status</div>
                <select className="req-input" value={rentalDealDrawer.status} onChange={(e) => updateRentalDeal(rentalDealDrawer.id, "status", e.target.value)}>
                  {RENTAL_DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="req-divider"><ClipboardList size={13} /> Activity ({(rentalDealDrawer.activity || []).length})</div>
                <div className="timeline">
                  {[...(rentalDealDrawer.activity || [])].sort((a, b) => b.timestamp - a.timestamp).map((entry) => (
                    <div className="timeline-item" key={entry.id}>
                      <div className="timeline-text">{entry.text}</div>
                      <div className="timeline-meta">{fmtDate(entry.timestamp)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer progress drawer */}
        {transferDeal && (
          <div className="drawer-overlay" onClick={() => setTransferDealId(null)}>
            <div className="drawer transfer-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">Transfer progress</div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{transferDeal.property}</h1>
                </div>
                <button className="drawer-close" onClick={() => setTransferDealId(null)}><X size={18} /></button>
              </div>

              <div className="drawer-body">
                <div className="field-label" style={{ marginTop: 0 }}>Projected registration date</div>
                <input
                  type="date"
                  className="req-input"
                  value={transferDeal.expRegDate}
                  onChange={(e) => updateDeal(transferDeal.id, "expRegDate", e.target.value)}
                />

                <div className="transfer-summary">
                  <div className="transfer-progress-track" style={{ flex: 1 }}>
                    <div className="transfer-progress-fill" style={{ width: (transferDeal.transferSteps.filter((s) => s.done).length / TRANSFER_STEPS.length) * 100 + "%" }} />
                  </div>
                  <span className="crm-mono">{transferDeal.transferSteps.filter((s) => s.done).length}/{TRANSFER_STEPS.length}</span>
                </div>

                <table className="transfer-table">
                  <thead>
                    <tr><th>Action</th><th>Completed</th><th>Date completed</th></tr>
                  </thead>
                  <tbody>
                    {transferDeal.transferSteps.map((s, i) => (
                      <tr key={s.key} className={s.done ? "step-done" : ""}>
                        <td>{i + 1}. {s.label}</td>
                        <td>
                          <button className={"step-check " + (s.done ? "done" : "")} onClick={() => toggleTransferStep(transferDeal.id, i)}>
                            {s.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                        </td>
                        <td>
                          {s.done ? (
                            <input
                              type="date"
                              className="req-input"
                              value={s.dateCompleted}
                              onChange={(e) => setTransferStepDate(transferDeal.id, i, e.target.value)}
                            />
                          ) : (
                            <span className="lead-sub">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* OTP (Offer to Purchase) drawer */}
        {otpDeal && (() => {
          const linkedTodo = otpTodoForDeal(otpDeal);
          const taskDone = !otpDeal.otpTodoId || (linkedTodo && linkedTodo.done);
          const attorneyEmail = attorneyEmails[otpDeal.att] || "";
          const attorneyPhone = attorneyPhones[otpDeal.att] || "";
          const agentContact = agentContacts[otpDeal.agent] || { cell: "", email: "" };
          return (
            <div className="drawer-overlay" onClick={() => setOtpDealId(null)}>
              <div className="drawer transfer-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-head">
                  <div>
                    <div className="topbar-eyebrow">Offer to Purchase</div>
                    <h1 className="crm-display" style={{ fontSize: 18 }}>{otpDeal.property}</h1>
                  </div>
                  <button className="drawer-close" onClick={() => setOtpDealId(null)}><X size={18} /></button>
                </div>

                <div className="drawer-body">
                  <div className="field-label" style={{ marginTop: 0 }}>Deal agent</div>
                  <div className="lead-sub" style={{ marginBottom: 10 }}>
                    <strong style={{ color: "var(--charcoal)" }}>{agentName(otpDeal.agent)}</strong>
                    {agentContact.cell || agentContact.email ? (
                      <> — {agentContact.cell || "no cell on file"} · {agentContact.email || "no email on file"}</>
                    ) : (
                      <span style={{ color: "var(--clay)" }}> — no contact details on file yet. Add them under Agents → Agent contact directory.</span>
                    )}
                  </div>

                  <div className="field-label">Step 1 — load into back-end system</div>
                  {otpDeal.otpTodoId ? (
                    <div className="otp-task-row">
                      <button className={"step-check " + (taskDone ? "done" : "")} onClick={() => toggleTodo(otpDeal.otpTodoId)}>
                        {taskDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <span>{taskDone ? "Loaded into back-end system" : "Waiting — this is on your To-Dos"}</span>
                    </div>
                  ) : (
                    <button className="stage-btn active" onClick={() => createOtpTask(otpDeal)}>Create back-end load task</button>
                  )}

                  {!taskDone && (
                    <div className="req-note">
                      <Info size={12} /> Emails can't go out until the Offer to Purchase has been loaded into the back-end system — tick the box above once that's done.
                    </div>
                  )}

                  <div className="field-label">Offer to Purchase attachment</div>
                  {otpDeal.otpFileName ? (
                    <div className="otp-file-row">
                      <FileText size={14} />
                      <a href={otpDeal.otpFileData} target="_blank" rel="noreferrer">{otpDeal.otpFileName}</a>
                      <label className="link-btn" style={{ cursor: "pointer" }}>
                        Replace
                        <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => handleOtpFileUpload(otpDeal.id, e.target.files[0])} />
                      </label>
                    </div>
                  ) : (
                    <label className="file-input-label">
                      <Upload size={13} /> Choose PDF...
                      <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => handleOtpFileUpload(otpDeal.id, e.target.files[0])} />
                    </label>
                  )}

                  <div className="field-label">Commission statement attachment</div>
                  {otpDeal.commStatementFileName ? (
                    <div className="otp-file-row">
                      <FileText size={14} />
                      <a href={otpDeal.commStatementFileData} target="_blank" rel="noreferrer">{otpDeal.commStatementFileName}</a>
                      <label className="link-btn" style={{ cursor: "pointer" }}>
                        Replace
                        <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => handleCommStatementUpload(otpDeal.id, e.target.files[0])} />
                      </label>
                    </div>
                  ) : (
                    <label className="file-input-label">
                      <Upload size={13} /> Choose PDF...
                      <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => handleCommStatementUpload(otpDeal.id, e.target.files[0])} />
                    </label>
                  )}
                  <div className="req-note" style={{ marginBottom: 0 }}>
                    <Info size={12} /> Browsers won't let an email link attach files automatically — both PDFs stay here for reference, but whoever sends the attorney email needs to manually attach them once their email app opens.
                  </div>

                  <div className="req-divider"><Mail size={13} /> Send to buyer, seller &amp; attorney</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
                    <div>
                      <div className="field-label" style={{ marginTop: 0 }}>Buyer name</div>
                      <input type="text" className="req-input" placeholder="Buyer full name" value={otpDeal.buyerName} onChange={(e) => updateDealOtp(otpDeal.id, "buyerName", e.target.value)} />
                    </div>
                    <div>
                      <div className="field-label" style={{ marginTop: 0 }}>Seller name</div>
                      <input type="text" className="req-input" placeholder="Seller full name" value={otpDeal.sellerName} onChange={(e) => updateDealOtp(otpDeal.id, "sellerName", e.target.value)} />
                    </div>
                  </div>

                  <div className="otp-send-row">
                    <div className="otp-send-label">Buyer</div>
                    <input
                      type="email" className="req-input" placeholder="buyer@email.com"
                      value={otpDeal.buyerEmail} onChange={(e) => updateDealOtp(otpDeal.id, "buyerEmail", e.target.value)}
                    />
                    <label className="otp-sent-check">
                      <input type="checkbox" checked={otpDeal.otpSentBuyer} onChange={(e) => updateDealOtp(otpDeal.id, "otpSentBuyer", e.target.checked)} /> Sent
                    </label>
                    <button className="stage-btn active" disabled={!taskDone || !otpDeal.buyerEmail} onClick={() => sendOtpEmail(otpDeal, "buyer", otpDeal.buyerEmail)}>Send</button>
                  </div>
                  <details className="otp-preview">
                    <summary>Preview buyer email</summary>
                    <pre>{buildBuyerEmailBody(otpDeal)}</pre>
                  </details>

                  <div className="otp-send-row">
                    <div className="otp-send-label">Seller</div>
                    <input
                      type="email" className="req-input" placeholder="seller@email.com"
                      value={otpDeal.sellerEmail} onChange={(e) => updateDealOtp(otpDeal.id, "sellerEmail", e.target.value)}
                    />
                    <label className="otp-sent-check">
                      <input type="checkbox" checked={otpDeal.otpSentSeller} onChange={(e) => updateDealOtp(otpDeal.id, "otpSentSeller", e.target.checked)} /> Sent
                    </label>
                    <button className="stage-btn active" disabled={!taskDone || !otpDeal.sellerEmail} onClick={() => sendOtpEmail(otpDeal, "seller", otpDeal.sellerEmail)}>Send</button>
                  </div>
                  <details className="otp-preview">
                    <summary>Preview seller email</summary>
                    <pre>{buildSellerEmailBody(otpDeal)}</pre>
                  </details>

                  <div className="otp-send-row">
                    <div className="otp-send-label">Attorney</div>
                    {attorneyEmail ? (
                      <div className="lead-sub" style={{ flex: 1 }}>{attorneyEmail}{attorneyPhone ? " · " + attorneyPhone : ""}</div>
                    ) : (
                      <div className="lead-sub" style={{ flex: 1, color: "var(--clay)" }}>
                        No email on file for "{otpDeal.att || "—"}" — add one under Attorneys &amp; Bonds
                      </div>
                    )}
                    <label className="otp-sent-check">
                      <input type="checkbox" checked={otpDeal.otpSentAttorney} onChange={(e) => updateDealOtp(otpDeal.id, "otpSentAttorney", e.target.checked)} /> Sent
                    </label>
                    <button className="stage-btn active" disabled={!taskDone || !attorneyEmail} onClick={() => sendOtpEmail(otpDeal, "attorney", attorneyEmail)}>Send</button>
                  </div>
                  <details className="otp-preview">
                    <summary>Preview attorney email</summary>
                    <pre>{buildAttorneyEmailBody(otpDeal)}</pre>
                  </details>

                  <div className="req-note">
                    <Info size={12} /> "Send" opens your email app with the address and subject pre-filled, and the real wording for all three — buyer, seller, and attorney. Attach the OTP and commission statement PDFs manually once the email opens; browsers don't allow email links to attach files automatically.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Offer drawer */}
        {offerDrawer && (
          <div className="drawer-overlay" onClick={() => setOfferDrawerId(null)}>
            <div className="drawer transfer-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <div>
                  <div className="topbar-eyebrow">
                    Offer
                    {offerDrawer.dealId && <span className="badge cond-confirmed" style={{ marginLeft: 8 }}>Converted → Deal</span>}
                  </div>
                  <h1 className="crm-display" style={{ fontSize: 18 }}>{offerDrawer.property || "Untitled offer"}</h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {!offerDrawer.dealId && (
                    <button
                      className="link-btn"
                      onClick={() => { if (confirm("Remove this offer? It'll no longer show up anywhere, including this agent's offer history.")) { removeOffer(offerDrawer.id); setOfferDrawerId(null); } }}
                    >
                      Remove
                    </button>
                  )}
                  <button className="drawer-close" onClick={() => setOfferDrawerId(null)}><X size={18} /></button>
                </div>
              </div>

              <div className="drawer-body">
                <div className="field-label" style={{ marginTop: 0 }}>Agent</div>
                {currentRole === "masterAdmin" || currentRole === "officeManager" ? (
                  <select className="req-input" value={offerDrawer.agent} onChange={(e) => updateOffer(offerDrawer.id, "agent", e.target.value)}>
                    {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ) : (
                  <div className="lead-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="agent-avatar-sm">{agentsList.find((a) => a.id === offerDrawer.agent)?.initials}</span>
                    <strong style={{ color: "var(--charcoal)" }}>{agentName(offerDrawer.agent)}</strong>
                  </div>
                )}

                <div className="field-label">Property</div>
                <AddressAutocompleteInput
                  className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.property} placeholder="Start typing an address..."
                  onChange={(v) => updateOffer(offerDrawer.id, "property", v)}
                  onSelectPlace={({ address, suburb }) => {
                    updateOffer(offerDrawer.id, "property", address);
                    if (suburb) updateOffer(offerDrawer.id, "suburb", suburb);
                  }}
                />
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Suburb</div>
                    <input type="text" className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.suburb} onChange={(e) => updateOffer(offerDrawer.id, "suburb", e.target.value)} />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Month</div>
                    <select className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.month || ""} onChange={(e) => updateOffer(offerDrawer.id, "month", e.target.value)}>
                      <option value="">— select —</option>
                      {MONTH_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="req-grid-2" style={{ marginTop: 16 }}>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Buyer</div>
                    <ContactPicker
                      roleLabel="Purchaser" nameValue={offerDrawer.buyerName} contactId={offerDrawer.buyerContactId}
                      contacts={manualContacts} disabled={!!offerDrawer.dealId}
                      onChangeName={(v) => updateOffer(offerDrawer.id, "buyerName", v)}
                      onLink={(c) => { updateOffer(offerDrawer.id, "buyerName", c.name); updateOffer(offerDrawer.id, "buyerContactId", c.id); }}
                      onUnlink={() => updateOffer(offerDrawer.id, "buyerContactId", "")}
                      onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                    />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Seller</div>
                    <ContactPicker
                      roleLabel="Seller" nameValue={offerDrawer.sellerName} contactId={offerDrawer.sellerContactId}
                      contacts={manualContacts} disabled={!!offerDrawer.dealId}
                      onChangeName={(v) => updateOffer(offerDrawer.id, "sellerName", v)}
                      onLink={(c) => { updateOffer(offerDrawer.id, "sellerName", c.name); updateOffer(offerDrawer.id, "sellerContactId", c.id); }}
                      onUnlink={() => updateOffer(offerDrawer.id, "sellerContactId", "")}
                      onCreateContact={createAndLinkContact} onOpenDetail={openContactDetail}
                    />
                  </div>
                </div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Buyer phone</div>
                    <input type="text" className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.buyerPhone} onChange={(e) => updateOffer(offerDrawer.id, "buyerPhone", e.target.value)} />
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Seller phone</div>
                    <input type="text" className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.sellerPhone} onChange={(e) => updateOffer(offerDrawer.id, "sellerPhone", e.target.value)} />
                  </div>
                </div>

                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Asking price</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.askingPrice} onChange={(e) => updateOffer(offerDrawer.id, "askingPrice", e.target.value)} /></div>
                  </div>
                  <div>
                    <div className="field-label">Offer made</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.offerMade} onChange={(e) => updateOffer(offerDrawer.id, "offerMade", e.target.value)} /></div>
                  </div>
                </div>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Seller counter</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.sellerCounterOffer} onChange={(e) => updateOffer(offerDrawer.id, "sellerCounterOffer", e.target.value)} /></div>
                  </div>
                  <div>
                    <div className="field-label">Buyer counter</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.buyerCounterOffer} onChange={(e) => updateOffer(offerDrawer.id, "buyerCounterOffer", e.target.value)} /></div>
                  </div>
                </div>
                {offerDrawer.agreed === "Yes" && (
                  <div className="req-grid-2">
                    <div>
                      <div className="field-label">Agreed price</div>
                      <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled value={offerDrawer.agreedPrice} onChange={() => {}} /></div>
                    </div>
                  </div>
                )}

                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Deposit</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.deposit} onChange={(e) => updateOffer(offerDrawer.id, "deposit", e.target.value)} /></div>
                  </div>
                  <div>
                    <div className="field-label">Cash portion</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.cashPortion} onChange={(e) => updateOffer(offerDrawer.id, "cashPortion", e.target.value)} /></div>
                  </div>
                </div>
                <label className="req-checkbox">
                  <input type="checkbox" disabled={!!offerDrawer.dealId} checked={!!offerDrawer.financeRequired} onChange={(e) => updateOffer(offerDrawer.id, "financeRequired", e.target.checked)} />
                  Finance required
                </label>
                {offerDrawer.financeRequired && (
                  <>
                    <div className="field-label">Bond originator</div>
                    <select className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.bondOriginator} onChange={(e) => updateOffer(offerDrawer.id, "bondOriginator", e.target.value)}>
                      <option value="">— select —</option>
                      {BOND_THROUGH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </>
                )}
                <div className="req-grid-2">
                  <div>
                    <div className="field-label">Occupation date</div>
                    <input type="date" className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.occupationDate} onChange={(e) => updateOffer(offerDrawer.id, "occupationDate", e.target.value)} />
                  </div>
                  <div>
                    <div className="field-label">Occupational rental</div>
                    <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.occupationalRental} onChange={(e) => updateOffer(offerDrawer.id, "occupationalRental", e.target.value)} /></div>
                  </div>
                </div>
                <div className="field-label">Conveyancer</div>
                <input type="text" className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.conveyancer} onChange={(e) => updateOffer(offerDrawer.id, "conveyancer", e.target.value)} />

                <div className="req-divider"><Handshake size={13} /> Split and commission</div>
                <div className="field-label" style={{ marginTop: 0 }}>Shared deal</div>
                <input type="text" className="req-input" placeholder="e.g. Yes External, Yes Internal" disabled={!!offerDrawer.dealId} value={offerDrawer.sharedDeal} onChange={(e) => updateOffer(offerDrawer.id, "sharedDeal", e.target.value)} />
                <div className="field-label">Listing agent</div>
                <select className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.listingAgent} onChange={(e) => updateOffer(offerDrawer.id, "listingAgent", e.target.value)}>
                  {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="req-grid-2">
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Shared with</div>
                    <select
                      className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.sharedWithAgent}
                      onChange={(e) => {
                        updateOffer(offerDrawer.id, "sharedWithAgent", e.target.value);
                        if (!e.target.value) updateOffer(offerDrawer.id, "sharedSplit", "");
                      }}
                    >
                      <option value="">— none —</option>
                      {agentsList.filter((a) => a.id !== offerDrawer.agent).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="field-label" style={{ marginTop: 0 }}>Split</div>
                    {offerDrawer.sharedWithAgent ? (
                      <select className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.sharedSplit} onChange={(e) => updateOffer(offerDrawer.id, "sharedSplit", e.target.value)}>
                        <option value="">Choose split...</option>
                        {SPLIT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className="split-disabled">— n/a —</span>
                    )}
                  </div>
                </div>
                <div className="field-label">Com % ex VAT</div>
                <input type="number" step={0.5} className="req-input" disabled={!!offerDrawer.dealId} value={offerDrawer.comPercent} onChange={(e) => updateOffer(offerDrawer.id, "comPercent", e.target.value)} />

                <div className="field-label">Status</div>
                {offerDrawer.dealId ? (
                  <button className="badge cond-confirmed offer-converted-btn" onClick={() => setNav("deals")}>Converted → Deal</button>
                ) : (
                  <div className="stage-btns">
                    {["Pending", "Yes", "No"].map((s) => (
                      <button
                        key={s}
                        className={"stage-btn " + (offerDrawer.agreed === s ? "active" : "")}
                        onClick={() => setOfferAgreed(offerDrawer.id, s)}
                      >
                        {s === "Yes" ? "Agreed: Yes" : s === "No" ? "No Deal" : "Pending"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="req-divider"><ArrowRight size={13} /> Negotiation history ({(offerDrawer.negotiations || []).length})</div>
                {(offerDrawer.negotiations || []).length === 0 ? (
                  <div className="lead-sub" style={{ padding: "4px 0" }}>No counters logged yet.</div>
                ) : (
                  <div className="timeline">
                    {[...offerDrawer.negotiations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((n) => (
                      <div className="timeline-item" key={n.id}>
                        <span className="badge note-typeFollowup">{n.party} · {n.action}</span>
                        <div className="timeline-text">{fmtPrice(n.amount || 0)}{n.notes ? " — " + n.notes : ""}</div>
                        <div className="timeline-meta">{n.created_by ? agentName(n.created_by) + " · " : ""}{fmtDate(new Date(n.created_at))}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="req-grid-2" style={{ marginTop: 8 }}>
                  <select className="req-input" value={negotiationDraft.party} onChange={(e) => setNegotiationDraft((d) => ({ ...d, party: e.target.value }))}>
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                  </select>
                  <select className="req-input" value={negotiationDraft.action} onChange={(e) => setNegotiationDraft((d) => ({ ...d, action: e.target.value }))}>
                    <option value="Counter">Counter</option>
                    <option value="Accept">Accept</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
                <div className="req-input-wrap"><span>R</span><MoneyInput className="req-input" value={negotiationDraft.amount} onChange={(e) => setNegotiationDraft((d) => ({ ...d, amount: e.target.value }))} /></div>
                <input type="text" className="req-input" placeholder="Notes (optional)" value={negotiationDraft.notes} onChange={(e) => setNegotiationDraft((d) => ({ ...d, notes: e.target.value }))} />
                <button className="stage-btn" style={{ marginTop: 8 }} onClick={() => logNegotiation(offerDrawer.id)}>Log negotiation</button>

                <div className="req-divider"><ClipboardList size={13} /> Notes</div>
                <textarea
                  className="req-input note-textarea"
                  placeholder="Log an update on this offer..."
                  value={offerNoteDraft}
                  onChange={(e) => setOfferNoteDraft(e.target.value)}
                />
                <div className="quick-note-row">
                  {OFFER_QUICK_NOTES.map((q) => (
                    <button key={q} className="quick-note-chip" onClick={() => addOfferNote(offerDrawer.id, q)}>{q}</button>
                  ))}
                </div>
                <button
                  className="stage-btn active"
                  style={{ marginTop: 8 }}
                  onClick={() => { addOfferNote(offerDrawer.id, offerNoteDraft); setOfferNoteDraft(""); }}
                >
                  Log note
                </button>

                <div className="req-divider"><ArrowRight size={13} /> Follow up</div>
                <select
                  className="req-input"
                  value={offerFollowUpDraft.reason}
                  onChange={(e) => setOfferFollowUpDraft((d) => ({ ...d, reason: e.target.value }))}
                >
                  {OFFER_FOLLOWUP_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="field-label">Follow-up date</div>
                <input
                  type="date"
                  className="req-input"
                  value={offerFollowUpDraft.date}
                  onChange={(e) => setOfferFollowUpDraft((d) => ({ ...d, date: e.target.value }))}
                />
                <textarea
                  className="req-input note-textarea"
                  style={{ marginTop: 8, minHeight: 50 }}
                  placeholder="Optional detail..."
                  value={offerFollowUpDraft.note}
                  onChange={(e) => setOfferFollowUpDraft((d) => ({ ...d, note: e.target.value }))}
                />
                <button
                  className="stage-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    addOfferFollowUp(offerDrawer.id, offerFollowUpDraft.reason, offerFollowUpDraft.date, offerFollowUpDraft.note);
                    setOfferFollowUpDraft({ reason: offerFollowUpDraft.reason, date: "", note: "" });
                  }}
                >
                  Create follow-up + add to my to-dos
                </button>

                <div className="req-divider"><CalendarPlus size={13} /> Meeting</div>
                <div className="field-label" style={{ marginTop: 0 }}>Meeting date &amp; time</div>
                <input
                  type="datetime-local"
                  className="req-input"
                  value={offerMeetingDraft.date}
                  onChange={(e) => setOfferMeetingDraft((d) => ({ ...d, date: e.target.value }))}
                />
                <textarea
                  className="req-input note-textarea"
                  style={{ marginTop: 8, minHeight: 50 }}
                  placeholder="Notes for the meeting invite..."
                  value={offerMeetingDraft.notes}
                  onChange={(e) => setOfferMeetingDraft((d) => ({ ...d, notes: e.target.value }))}
                />
                <button
                  className="stage-btn active"
                  style={{ marginTop: 8 }}
                  disabled={!offerMeetingDraft.date}
                  onClick={() => {
                    addOfferMeeting(offerDrawer.id, offerMeetingDraft.date, offerMeetingDraft.notes);
                    setOfferMeetingDraft({ date: "", notes: "" });
                  }}
                >
                  <CalendarPlus size={13} style={{ marginRight: 4 }} /> Add to Outlook &amp; log
                </button>

                <div className="req-divider"><ClipboardList size={13} /> Activity ({(offerDrawer.activity || []).length})</div>
                <div className="timeline">
                  {[...(offerDrawer.activity || [])].sort((a, b) => b.timestamp - a.timestamp).map((entry) => (
                    <div className="timeline-item" key={entry.id}>
                      <span className={"badge note-type" + entry.type.replace(/[^A-Za-z]/g, "")}>{entry.type}</span>
                      <div className="timeline-text">{entry.text}</div>
                      <div className="timeline-meta">
                        {entry.author ? agentName(entry.author) + " · " : ""}{fmtDate(entry.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registered confirmation popup */}
        {registeringDealId && (
          <div className="drawer-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={() => setRegisteringDealId(null)}>
            <div className="register-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head" style={{ padding: "16px 18px" }}>
                <div>
                  <div className="topbar-eyebrow">Confirm registration</div>
                  <h1 className="crm-display" style={{ fontSize: 16 }}>
                    {deals.find((d) => d.id === registeringDealId)?.property || "This deal"}
                  </h1>
                </div>
                <button className="drawer-close" onClick={() => setRegisteringDealId(null)}><X size={18} /></button>
              </div>
              <div style={{ padding: "0 18px 18px 18px" }}>
                <div className="field-label" style={{ marginTop: 0 }}>Date registered</div>
                <input
                  type="date"
                  className="req-input"
                  value={registeredDateDraft}
                  onChange={(e) => setRegisteredDateDraft(e.target.value)}
                />
                <div className="req-note" style={{ marginBottom: 0 }}>
                  <Info size={12} /> This moves the deal into Registered Deals and logs a timestamped note.
                </div>
                <button className="stage-btn active" style={{ marginTop: 12, width: "100%" }} onClick={confirmDealRegistered}>
                  <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Confirm Registered
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { session, profile, loading, profileError, needsPassword, clearNeedsPassword } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1526", color: "#fff" }}>
        Loading…
      </div>
    );
  }
  if (!session) return <Login />;
  if (needsPassword) return <SetPassword email={session.user.email} onDone={clearNeedsPassword} />;
  if (!profile) return <PendingApproval email={session.user.email} error={profileError} />;
  return <RealtyCRM profile={profile} />;
}
