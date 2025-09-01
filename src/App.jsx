import React, { useEffect, useMemo, useRef, useState } from "react";
import catalog from "./data/catalog.json";
import { parseCommand, categorize } from "./utils/nlp";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function App() {
  const [supported, setSupported] = useState(!!SpeechRecognition);
  const [list, setList] = useState([]); 
  const [listMsg, setListMsg] = useState(null); 
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en-IN");
  const recRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [history, setHistory] = useState([]); 

  useEffect(() => {
    if (!supported) return;
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const chunk = r[0].transcript;
        if (r.isFinal) finalText += chunk;
        setTranscript((t) => (r.isFinal ? (t + " " + chunk).trim() : (chunk)));
      }
      if (finalText) handleText(finalText);
    };
    rec.onerror = (e) => setListMsg({ type: "bad", text: `Voice error: ${e.error}` });
    recRef.current = rec;
  }, [supported, lang]);

  function start() { if (recRef.current && !listening) { recRef.current.start(); setListening(true); setListMsg({ type:'ok', text:'Listening...' }); } }
  function stop() { if (recRef.current && listening) { recRef.current.stop(); setListening(false); setListMsg({ type:'ok', text:'Stopped.' }); } }
  function clearTranscript(){ setTranscript(""); }

  function handleText(text) {
    const cmd = parseCommand(text);
    if (cmd.action === "add") {
      addItem(cmd.item, cmd.qty || 1);
    } else if (cmd.action === "remove") {
      removeItem(cmd.item);
    } else if (cmd.action === "modify") {
      modifyItem(cmd.item, cmd.qty || 1);
    } else if (cmd.action === "search") {
      doSearch(cmd.item, cmd.maxPrice);
    } else {
      setListMsg({ type: "bad", text: `Didn't catch that. Try: "add 2 apples", "remove milk", "find toothpaste under 5".` });
    }
  }

  function normalizeName(name) {
    return name.replace(/\b(\d+)(l|kg|g|ml)\b/gi, "").trim();
  }

  function addItem(rawName, qty) {
    const name = normalizeName(rawName);
    const category = categorize(name);
    setList((prev) => {
      const idx = prev.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += qty;
        return next;
      }
      return [...prev, { name, qty, category }];
    });
    setHistory(h => [name, ...h].slice(0, 200));
    setListMsg({ type: "ok", text: `Added ${qty} × ${name}.` });
  }

  function removeItem(rawName) {
    const name = normalizeName(rawName);
    setList((prev) => {
      const next = prev.filter(i => i.name.toLowerCase() !== name.toLowerCase());
      return next;
    });
    setListMsg({ type: "ok", text: `Removed ${name}.` });
  }

  function modifyItem(rawName, qty) {
    const name = normalizeName(rawName);
    setList((prev) => {
      const idx = prev.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty = qty;
        return next;
      }
      return prev;
    });
    setListMsg({ type: "ok", text: `Set ${name} to ${qty}.` });
  }

  function doSearch(q, maxPrice) {
    const ql = q.toLowerCase();
    let res = catalog.filter(p => p.name.toLowerCase().includes(ql) || p.brand.toLowerCase().includes(ql));
    if (maxPrice != null) res = res.filter(p => p.price <= maxPrice);
    setSearchResults(res);
    setListMsg({ type: "ok", text: `Search results for "${q}"${maxPrice ? ` under $${maxPrice}` : ""}.` });
  }

  // Simple seasonal suggestions (assuming India, Aug–Sep: mangoes end, festive staples)
  const seasonal = useMemo(() => ["Mangoes", "Brown Bread", "Toothpaste"], []);

  const freq = useMemo(() => {
    const map = new Map();
    history.forEach(n => map.set(n.toLowerCase(), (map.get(n.toLowerCase()) || 0) + 1));
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0,6).map(([k]) => k);
  }, [history]);

  const suggestions = useMemo(() => {
    const set = new Set([...freq, ...seasonal.map(s => s.toLowerCase())]);
    return Array.from(set).map(n => n[0].toUpperCase() + n.slice(1));
  }, [freq, seasonal]);

  return (
    <div className="app">
      <div className="header">
        <div className="title">🛒 Voice Command Shopping Assistant</div>
        <div className="controls">
          <select className="button" value={lang} onChange={(e)=>setLang(e.target.value)}>
            <option value="en-IN">English (India)</option>
            <option value="en-US">English (US)</option>
            <option value="hi-IN">हिंदी (भारत)</option>
          </select>
          <button className="button" onClick={start} disabled={!supported || listening}>🎙️ Start</button>
          <button className="button" onClick={stop} disabled={!supported || !listening}>⏹ Stop</button>
          <button className="button" onClick={clearTranscript}>🧹 Clear</button>
          <span className="pill">{supported ? (listening ? "Listening..." : "Ready") : "Voice not supported"}</span>
        </div>
      </div>

      {listMsg && <div className={`msg ${listMsg.type === 'ok' ? 'ok' : 'bad'}`}>{listMsg.text}</div>}

      <div className="row">
        <div className="col">
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <strong>Live Transcript</strong>
              <span className="small">Try: <span className="kbd">add 2 apples</span>, <span className="kbd">remove milk</span>, <span className="kbd">find toothpaste under 5</span></span>
            </div>
            <div className="msg">{transcript || "Say a command..."}</div>
          </div>

          <div className="card">
            <strong>Smart Suggestions</strong>
            <div className="suggest" style={{marginTop:8}}>
              {suggestions.map(s => (
                <span className="pill" key={s} onClick={()=>addItem(s, 1)}>{s}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <strong>Voice-Activated Search</strong>
            <div className="small" style={{marginTop:6}}>Say <span className="kbd">find apples</span> or <span className="kbd">find toothpaste under 5</span></div>
            <div className="searchResults" style={{marginTop:10}}>
              {searchResults.map((p, i) => (
                <div className="item" key={i}>
                  <div><strong>{p.name}</strong></div>
                  <div className="meta">
                    <span>{p.brand}</span>
                    <span>${p.price}</span>
                  </div>
                  <button className="button" onClick={()=>addItem(p.name, 1)}>Add</button>
                </div>
              ))}
              {searchResults.length === 0 && <div className="small">No results yet.</div>}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <strong>Shopping List</strong>
            <div className="list" style={{marginTop:10}}>
              {list.map((it, idx) => (
                <div className="item" key={idx}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div><strong>{it.name}</strong></div>
                    <span className="badge pill">{it.category}</span>
                  </div>
                  <div className="qty">
                    <span>Qty:</span>
                    <input type="text" value={it.qty} onChange={(e)=>{
                      const v = parseInt(e.target.value||"1", 10) || 1;
                      setList(prev => {
                        const next = [...prev];
                        next[idx].qty = v;
                        return next;
                      });
                    }} style={{width:60}}/>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button className="button" onClick={()=>modifyItem(it.name, it.qty+1)}>+1</button>
                    <button className="button" onClick={()=>modifyItem(it.name, Math.max(1, it.qty-1))}>-1</button>
                    <button className="button" onClick={()=>removeItem(it.name)}>Remove</button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="small">Your list is empty. Try a voice command or click a suggestion.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="footer">Built with Web Speech API • Multilingual ready (en-IN, en-US, hi-IN) • Mock catalog search</div>
    </div>
  );
}
