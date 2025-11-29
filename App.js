import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase'; 
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  Plus, Check, Trash2, FolderPlus, PlayCircle, Save, Edit3, X, List, Folder, Clock, Trophy, ExternalLink, Dice5, Pencil, AlertTriangle, Search, ListChecks, LogOut 
} from 'lucide-react';

// --- 統一資料路徑 (確保同步) ---
const COLLECTION_NAME = "anime_tracker_data";

// --- 圖示元件 ---
const Icons = { Plus, Check, Trash2, FolderPlus, PlayCircle, Save, Edit3, X, List, Folder, Clock, Trophy, ExternalLink, Dice5, Pencil, AlertTriangle, Search, ListChecks, LogOut, Google: () => <span className="font-bold text-lg">G</span> };

// --- 初始資料常數 ---
const RATED_SOURCE = [{r:6,items:["Lycoris Recoil 莉可麗絲 Friends are thieves of time","藥師少女的獨語 第二季","青春豬頭少年不會夢到聖誕服女郎","薰香花朵凛然綻放","Silent Witch 沉默魔女的秘密"]},{r:5,items:["青春之箱","結緣甘神神社","紫雲寺家的兄弟姊妹","戀上換裝娃娃 第2季","我們不可能成為戀人！絕對不行。（※似乎可行？）"]},{r:4,items:["黑岩目高不把我的可愛放在眼裡","妻子變成小學生","Love Live! Superstar!!","只想告訴你","群花綻放","我和班上最討厭的女生結婚了","GATE 奇幻自衛隊","天久鷹央","SAKAMOTO DAYS"]},{r:3,items:["七大罪","聽說你們要結婚","轉生為第七王子","版本日常學園","默示錄","我的幸福婚約","炎炎消防隊","小市民系列","男女之間存在純友情嗎","章魚嗶的原罪","mono女孩","隨興旅","盾之勇者"]},{r:2,items:["的偵探這沒用","忍者與殺手的兩人生活","僕愛君愛","未來日記","雖然是公會的櫃檯小姐","歡迎光臨流放者食堂"]},{r:1,items:["公爵千金的家庭教師","精靈幻想記","魔法光源","時光沙漏","剎那之花","這個美術社大有問題"]}];
const SEASONAL_SOURCE = [
  {name:"2025 10月",items:["SPY×FAMILY 第三季","擁有超常技能","一拳超人 第三季","彈珠汽水瓶","對我垂涎欲滴","我的英雄學院 FINAL","朋友的妹妹","女騎士成為蠻族新娘","這裡是充滿笑容的職場","機械女僕","不動聲色的柏田","野原廣志","跨越種族","永久的黃昏","不擅吸血的吸血鬼","不中用的前輩","賽馬娘 灰髮","最後可以再拜託您一件事嗎"]},
  {name:"2025 7月",items:["章魚嗶的原罪","戀上換裝娃娃 S2","Silent Witch","薰香花朵凛然綻放","SAKAMOTO DAYS S2","青春豬頭少年","盾之勇者 S4","轉生為第七王子 S2","怪獸8號 S2","住在拔作島上的我","我們不可能成為戀人","渡同學","9-nine-","BadGirl","出租女友 S4","歡迎光臨流放者食堂","Dr.STONE","和雨·和你","膽大黨 S2","遊樂場少女","公爵千金","歌聲是法式千層酥","最近的偵探"]},
  {name:"2025 4月",items:["持續狩獵史萊姆","WITCH WATCH","賽馬娘 Cinderella Grey","男女之間存在純友情嗎","小市民系列 S2","直至魔女消逝","隨興旅","炎炎消防隊","mono女孩","九龍大眾浪漫","因為太完美而不可愛","記憶縫線","Summer Pockets","紫雲寺家","忍者與殺手","推理要在晚餐後","在棒球場抓住我","愛有點沉重","前橋魔女","這是妳與我的最後戰場","快藏好","拜託請穿上","ツインズひなひま","Lycoris Recoil"]},
  {name:"2025 1月",items:["我獨自升級 S2","藥師少女 S2","我的幸福婚約 S2","100個女朋友 S2","新石紀 S4","異修羅 S2","天久鷹央","灰色幻影","Ave Mujica","MOMENTARY LILY","我和班上最討厭的女生結婚了","一桿青空","公會櫃檯小姐","群花綻放","青春特調","Unnamed Memory","沖繩喜歡上的女孩子","黑岩目高","歡迎來到日本","尼特女忍者","這公司有我喜歡的人","終究還是會戀愛","全修","版本日常"]}
];
const RATING_TIERS = [{label:'⭐️⭐️⭐️⭐️⭐️⭐️ (神作)',value:6},{label:'⭐️⭐️⭐️⭐️⭐️ (必看)',value:5},{label:'⭐️⭐️⭐️⭐️ (推薦)',value:4},{label:'⭐️⭐️⭐️ (普通)',value:3},{label:'⭐️⭐️ (微妙)',value:2},{label:'⭐️ (雷作)',value:1},{label:'放棄 (棄番)',value:0},{label:'未評價',value:-1}];
const normalize = (str) => str.replace(/[\s\u3000]/g, '').replace(/[（(].*?[)）]/g, '').replace(/[*^_^]/g, '').toLowerCase();

const generateInitialData = () => {
  const history = [], seasonal = [], historyMap = new Set();
  RATED_SOURCE.forEach(tier => tier.items.forEach(name => { const n=name.trim(); history.push({id:`h-${Math.random().toString(36).substr(2,9)}`,name:n,rating:tier.r,note:'',date:new Date().toISOString().split('T')[0],isCrossSeason:false}); historyMap.add(normalize(n)); }));
  SEASONAL_SOURCE.forEach((s, i) => {
    const isFuture = s.name.includes("2025 10月");
    const items = s.items.map((n, j) => {
      const clean = n.replace(/\(.*\)|（.*）|\*|^_^/g, '').trim();
      const norm = normalize(clean);
      if(!isFuture && !historyMap.has(norm)) { history.push({id:`hu-${Math.random().toString(36).substr(2,9)}`,name:clean,rating:-1,note:'自動導入',date:new Date().toISOString().split('T')[0],isCrossSeason:false}); historyMap.add(norm); }
      return {id:`s-${i}-${j}-${Math.random().toString(36).substr(2,5)}`,name:clean,note:'',isCrossSeason:false};
    });
    seasonal.push({id:`folder-${i}`,name:s.name,items});
  });
  return {toWatch:[], seasonal, history};
};

export default function App() {
  const [activeTab, setActiveTab] = useState('towatch');
  const [data, setDataState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [rateModal, setRateModal] = useState({ isOpen: false, item: null, source: null });
  const [resetConfirm, setResetConfirm] = useState(false);

  // --- Auth & Data Sync ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, "users", u.uid, COLLECTION_NAME, "main");
        const unsubData = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setDataState(docSnap.data());
          } else {
            const initial = generateInitialData();
            setDoc(docRef, initial);
            setDataState(initial);
          }
          setLoading(false);
        }, (err) => {
          console.error("Sync Error:", err);
          setLoading(false);
        });
        return () => unsubData();
      } else {
        setLoading(false);
      }
    });

    getRedirectResult(auth).then((result) => {
       if (result) console.log("Redirect login success");
    }).catch((error) => {
       console.error("Redirect error:", error);
       setAuthError(error.message);
    });

    return () => unsubAuth();
  }, []);

  // --- Update Data Helper ---
  const updateData = (newData) => {
    if (!user) return;
    setDataState(newData); 
    setDoc(doc(db, "users", user.uid, COLLECTION_NAME, "main"), newData).catch(console.error);
  };

  // --- Auth Actions ---
  const login = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    setIsProcessing(true);
    try {
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
        setIsProcessing(false);
      }
    } catch (error) {
      console.warn("Login fallback:", error);
      try {
        await signInWithRedirect(auth, provider);
      } catch(e) {
        setAuthError(e.message);
        setIsProcessing(false);
      }
    }
  };
  
  const logout = () => signOut(auth);

  // --- Data Actions ---
  const handleGoogleSearch = (name) => window.open(`https://www.google.com/search?q=${encodeURIComponent(name)}`, '_blank');
  const requestDelete = (type, id, name, folderId) => setDeletingItem({ type, id, name, folderId });
  
  const confirmDelete = () => {
    if (!deletingItem || !data) return;
    const { type, id, folderId } = deletingItem;
    const newData = { ...data };
    
    if (type === 'towatch') newData.toWatch = newData.toWatch.filter(i => i.id !== id);
    else if (type === 'history') newData.history = newData.history.filter(i => i.id !== id);
    else if (type === 'seasonal') {
      const fIdx = newData.seasonal.findIndex(f => f.id === folderId);
      if (fIdx > -1) newData.seasonal[fIdx].items = newData.seasonal[fIdx].items.filter(i => i.id !== id);
    }
    updateData(newData);
    setDeletingItem(null);
  };

  const saveEdit = (item) => {
    const { type, listId, folderId } = editingItem;
    const newData = { ...data };
    if (type === 'towatch') newData.toWatch = newData.toWatch.map(i => i.id === listId ? { ...i, ...item } : i);
    else if (type === 'history') newData.history = newData.history.map(i => i.id === listId ? { ...i, ...item } : i);
    else if (type === 'seasonal') {
      const fIdx = newData.seasonal.findIndex(f => f.id === folderId);
      if (fIdx > -1) newData.seasonal[fIdx].items = newData.seasonal[fIdx].items.map(i => i.id === listId ? { ...i, ...item } : i);
    }
    updateData(newData);
    setEditingItem(null);
  };

  const confirmRate = (rating, note) => {
    const { item, source } = rateModal;
    const newData = { ...data };
    const normName = normalize(item.name);
    
    newData.history = [{...item, id:`h-${Date.now()}`, rating, note, date:new Date().toISOString().split('T')[0]}, ...newData.history];
    
    if (source === 'towatch') newData.toWatch = newData.toWatch.filter(i => i.id !== item.id);
    else if (source === 'seasonal') newData.toWatch = newData.toWatch.filter(i => normalize(i.name) !== normName);
    
    updateData(newData);
    setRateModal({ isOpen: false, item: null });
  };

  const performReset = () => {
    updateData(generateInitialData());
    setResetConfirm(false);
  };

  // --- Missing Functions Fixed Here ---
  const openEditModal = (type, item, folderId = null) => {
    setEditingItem({ type, listId: item.id, item, folderId });
  };

  const openRateModal = (item, source) => {
    setRateModal({ isOpen: true, item, source });
  };

  // --- Render ---
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">載入中...</div>;
  if (!user) return (
    <div className="flex flex-col h-screen items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-lg border border-white/20 text-center w-full max-w-sm shadow-xl">
        <Icons.PlayCircle className="w-16 h-16 mx-auto mb-4 text-white/80" />
        <h1 className="text-2xl font-bold mb-2">追番君 Sync</h1>
        <p className="text-white/60 mb-8 text-sm">登入以同步您的追番進度</p>
        {authError && <div className="bg-red-500/20 p-2 rounded text-xs text-red-200 mb-4 break-all">{authError}</div>}
        <button onClick={login} disabled={isProcessing} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
          {isProcessing ? '處理中...' : <><span className="font-bold text-lg">G</span> 使用 Google 登入</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-[#f9fafb] text-gray-800 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <nav className="bg-indigo-600 text-white shadow-md sticky top-0 z-50 pt-[env(safe-area-inset-top)] -mt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <h1 className="font-bold flex items-center gap-2"><Icons.PlayCircle className="w-5 h-5"/> 追番君</h1>
            <div className="flex items-center gap-3">
              {user.photoURL && <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full border border-white/30" />}
              <button onClick={()=>signOut(auth)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"><Icons.LogOut className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex space-x-1 pb-0 overflow-x-auto hide-scrollbar">
            {[{id:'towatch', label:'待看', icon:Icons.List}, {id:'seasonal', label:'新番', icon:Icons.Folder}, {id:'history', label:'紀錄', icon:Icons.Clock}].map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${activeTab===tab.id ? 'bg-[#f9fafb] text-indigo-600' : 'text-indigo-100 hover:bg-white/10'}`}>
                <tab.icon className="w-4 h-4"/> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-3">
        {activeTab === 'towatch' && <ToWatchView list={data.toWatch} onUpdate={updateData} onSearch={handleGoogleSearch} onDelete={(id, name)=>requestDelete('towatch', id, name)} onEdit={(item)=>openEditModal('towatch', item)} onRate={(item)=>openRateModal(item, 'towatch')} />}
        {activeTab === 'seasonal' && <SeasonalView data={data.seasonal} history={data.history} onUpdate={(newSeasonal)=>updateData({...data, seasonal: newSeasonal})} onImport={(items)=>updateData({...data, toWatch:[...data.toWatch, ...items]})} onSearch={handleGoogleSearch} onDelete={(id, name, fid)=>requestDelete('seasonal', id, name, fid)} onEdit={(item, fid)=>openEditModal('seasonal', item, fid)} onRate={(item)=>openRateModal(item, 'seasonal')} />}
        {activeTab === 'history' && <HistoryView list={data.history} onUpdate={(newHistory)=>updateData({...data, history: newHistory})} onSearch={handleGoogleSearch} onDelete={(id, name)=>requestDelete('history', id, name)} onEdit={(item)=>openEditModal('history', item)} />}
      </main>

      <div className="fixed bottom-2 left-0 right-0 text-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <span className="text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur">v1.4 ● 已同步</span>
      </div>

      {editingItem && <Modal title="編輯" onClose={()=>setEditingItem(null)}><EditForm initialData={editingItem.item} onSave={saveEdit} onClose={()=>setEditingItem(null)} /></Modal>}
      {deletingItem && <Modal title="刪除確認" onClose={()=>setDeletingItem(null)}><div className="text-center p-4"><p className="mb-4">確定刪除「{deletingItem.name}」？</p><div className="flex gap-2"><button onClick={()=>setDeletingItem(null)} className="flex-1 py-2 bg-gray-100 rounded">取消</button><button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded">刪除</button></div></div></Modal>}
      {rateModal.isOpen && <Modal title={`完食評分：${rateModal.item.name}`} onClose={()=>setRateModal({isOpen:false})}><RateForm item={rateModal.item} onConfirm={confirmRate} onCancel={()=>setRateModal({isOpen:false})} /></Modal>}
      {resetConfirm && <Modal title="重置確認" onClose={()=>setResetConfirm(false)}><div className="text-center p-4"><p className="mb-4 text-red-600 font-bold">警告：此操作將刪除所有自訂紀錄並還原至預設值。</p><div className="flex gap-2"><button onClick={()=>setResetConfirm(false)} className="flex-1 py-2 bg-gray-100 rounded">取消</button><button onClick={performReset} className="flex-1 py-2 bg-red-600 text-white rounded">確認重置</button></div></div></Modal>}
    </div>
  );
}

// --- Sub Components (Correctly Defined) ---

function ToWatchView({ list, onUpdate, onSearch, onDelete, onEdit, onRate }) {
  const [name, setName] = useState('');
  const [gachaResult, setGachaResult] = useState(null);
  const add = (e) => { e.preventDefault(); if(!name.trim()) return; onUpdate(p => ({...p, toWatch:[...p.toWatch, {id:Date.now().toString(), name, note:'', isCrossSeason:false}]})); setName(''); };
  const gacha = () => { if(!list.length) return alert("無資料"); setGachaResult(list[Math.floor(Math.random()*list.length)]); };
  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-xl shadow-sm border flex gap-2"><input className="flex-1 outline-none" placeholder="新增待看..." value={name} onChange={e=>setName(e.target.value)} /><button onClick={add} className="text-indigo-600"><Icons.Plus/></button></div>
      <div className="flex justify-end"><button onClick={gacha} className="text-xs bg-pink-500 text-white px-3 py-1.5 rounded-full shadow flex gap-1"><Icons.Dice5 className="w-3 h-3"/> 抽選</button></div>
      <div className="space-y-2">{list.map(i => (
        <div key={i.id} className="bg-white p-3 rounded-lg border flex gap-3 items-start"><button onClick={()=>onRate(i)} className="mt-0.5 text-gray-300 hover:text-green-500"><Icons.Check className="w-5 h-5"/></button><div className="flex-1"><div className="flex justify-between"><span onClick={()=>onSearch(i.name)} className="font-medium cursor-pointer">{i.name}</span><div className="flex gap-2 text-gray-400"><Icons.Edit3 className="w-4 h-4 cursor-pointer" onClick={()=>onEdit(i)} /><Icons.Trash2 className="w-4 h-4 cursor-pointer text-red-300 hover:text-red-500" onClick={()=>onDelete(i.id, i.name)} /></div></div><div className="text-xs text-gray-400 mt-1">{i.isCrossSeason && <span className="bg-purple-100 text-purple-600 px-1 rounded mr-1">跨</span>}{i.note}</div></div></div>
      ))}</div>
      {gachaResult && <Modal title="抽選結果" onClose={()=>setGachaResult(null)}><div className="text-center p-6"><h2 className="text-xl font-bold mb-4">{gachaResult.name}</h2><button onClick={()=>setGachaResult(null)} className="w-full py-2 bg-indigo-600 text-white rounded">OK</button></div></Modal>}
    </div>
  );
}

function SeasonalView({ data, history, onUpdate, onImport, onSearch, onDelete, onEdit, onRate }) {
  const [term, setTerm] = useState('');
  const [exp, setExp] = useState({});
  const [batch, setBatch] = useState(false);
  const [sel, setSel] = useState(new Set());
  
  const filtered = useMemo(() => {
    if(!term) return data;
    const t = term.toLowerCase();
    return data.map(f => ({...f, items: f.items.filter(i => i.name.toLowerCase().includes(t))})).filter(f => f.items.length > 0);
  }, [data, term]);
  
  const isWatched = (n) => history.some(h => h.name.replace(/\s/g,'') === n.replace(/\s/g,''));
  const toggleSel = (id) => { const s = new Set(sel); if(s.has(id)) s.delete(id); else s.add(id); setSel(s); };
  const delSel = () => { if(window.confirm(`刪除 ${sel.size} 項?`)) { onUpdate(data.map(f => ({...f, items: f.items.filter(i => !sel.has(i.id))}))); setSel(new Set()); setBatch(false); } };
  const add = (fid, name) => onUpdate(data.map(f => f.id===fid ? {...f, items:[...f.items, {id:Date.now().toString(), name, note:'', isCrossSeason:false}]} : f));
  const importFolder = (items) => { onImport(items.map(i => ({...i, id:`imp-${Date.now()}-${Math.random()}`}))); alert("已匯入"); };

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-lg border flex gap-2 items-center sticky top-0 z-10">
        {batch ? (
          <div className="flex justify-between w-full items-center px-1"><span className="text-sm text-gray-500">已選 {sel.size}</span><div className="flex gap-2"><button onClick={delSel} className="text-red-500 text-sm font-bold" disabled={!sel.size}>刪除</button><button onClick={()=>{setBatch(false);setSel(new Set())}} className="text-gray-500 text-sm">取消</button></div></div>
        ) : (
          <><Icons.Search className="text-gray-400 w-4 h-4"/><input placeholder="搜尋..." className="flex-1 outline-none text-sm" value={term} onChange={e=>setTerm(e.target.value)} /><button onClick={()=>setBatch(true)} className="p-1 bg-gray-100 rounded"><Icons.ListChecks className="w-4 h-4"/></button></>
        )}
      </div>
      <div className="space-y-3">{filtered.map(f => {
        const open = term || batch || exp[f.id];
        const watched = f.items.filter(i=>isWatched(i.name)).length;
        const sorted = [...f.items].sort((a,b) => (isWatched(a.name)===isWatched(b.name)?0:isWatched(a.name)?1:-1));
        return (
          <div key={f.id} className="bg-white rounded-lg border overflow-hidden">
            <div onClick={()=>!term&&!batch&&setExp(p=>({...p,[f.id]:!p[f.id]}))} className="flex justify-between p-3 bg-gray-50 border-b text-sm font-bold cursor-pointer">
              <div className="flex items-center gap-2"><span className={open?'rotate-90 transition':''}>▶</span> {f.name} <span className="text-xs font-normal text-gray-400">{watched}/{f.items.length}</span></div>
              {!term && !batch && <button onClick={(e)=>{e.stopPropagation();importFolder(f.items)}} className="text-blue-500"><Icons.Save className="w-4 h-4"/></button>}
            </div>
            {open && <div className="p-3">
              {!batch && !term && <form onSubmit={e=>{e.preventDefault();add(f.id,e.target[0].value);e.target[0].value=''}} className="flex gap-2 mb-3"><input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="新增..." /><button className="text-indigo-600 text-sm">新增</button></form>}
              <div className="space-y-2">{sorted.map(i => (
                <div key={i.id} className={`flex gap-3 p-2 rounded border text-sm ${isWatched(i.name)?'bg-green-50 border-green-200 opacity-70':'bg-white'}`}>
                  <div className="mt-0.5">{batch ? <div onClick={()=>toggleSel(i.id)} className={`w-5 h-5 border rounded flex items-center justify-center ${sel.has(i.id)?'bg-red-500 border-red-500 text-white':''}`}>{sel.has(i.id)&&<Icons.Check className="w-3 h-3"/>}</div> : (isWatched(i.name)?<Icons.Check className="w-5 h-5 text-green-600"/>:<button onClick={()=>onRate(i)} className="w-5 h-5 border rounded hover:border-green-500"></button>)}</div>
                  <div className="flex-1"><div className="flex justify-between"><span onClick={()=>!batch&&onSearch(i.name)} className="font-medium cursor-pointer">{i.name}</span>{!batch&&<div className="flex gap-2 text-gray-400"><Icons.Edit3 className="w-3.5 h-3.5 cursor-pointer" onClick={()=>onEdit(i,f.id)} /><Icons.Trash2 className="w-3.5 h-3.5 cursor-pointer text-red-300" onClick={()=>onDelete(i.id,i.name,f.id)} /></div>}</div><div className="text-xs text-gray-400">{i.note}</div></div>
                </div>
              ))}</div>
            </div>}
          </div>
        )
      })}</div>
    </div>
  );
}

function HistoryView({ list, onUpdate, onSearch, onDelete, onEdit }) {
  const [term, setTerm] = useState('');
  const [batch, setBatch] = useState(false);
  const [sel, setSel] = useState(new Set());
  
  const filtered = useMemo(() => term ? list.filter(i => i.name.toLowerCase().includes(term.toLowerCase())) : list, [list, term]);
  const groups = useMemo(() => { const g={}; RATING_TIERS.forEach(t=>g[t.value]=[]); filtered.forEach(i=>{ const r=i.rating??0; if(g[r]) g[r].push(i); }); return g; }, [filtered]);
  
  const toggleSel = (id) => { const s = new Set(sel); if(s.has(id)) s.delete(id); else s.add(id); setSel(s); };
  const delSel = () => { if(window.confirm(`刪除 ${sel.size} 項?`)) { onUpdate(list.filter(i => !sel.has(i.id))); setSel(new Set()); setBatch(false); } };

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-lg border flex gap-2 items-center sticky top-0 z-10">
        {batch ? (
          <div className="flex justify-between w-full items-center px-1"><span className="text-sm text-gray-500">已選 {sel.size}</span><div className="flex gap-2"><button onClick={delSel} className="text-red-500 text-sm font-bold" disabled={!sel.size}>刪除</button><button onClick={()=>{setBatch(false);setSel(new Set())}} className="text-gray-500 text-sm">取消</button></div></div>
        ) : (
          <><Icons.Search className="text-gray-400 w-4 h-4"/><input placeholder="搜尋紀錄..." className="flex-1 outline-none text-sm" value={term} onChange={e=>setTerm(e.target.value)} /><button onClick={()=>setBatch(true)} className="p-1 bg-gray-100 rounded"><Icons.ListChecks className="w-4 h-4"/></button></>
        )}
      </div>
      <div className="space-y-6">{RATING_TIERS.map(t => {
        const items = groups[t.value]||[]; if(!items.length) return null;
        return (
          <div key={t.value}>
            <h3 className="font-bold text-indigo-600 border-b mb-2 pb-1 flex justify-between"><span>{t.label}</span><span className="text-xs bg-gray-100 px-2 rounded-full text-gray-500">{items.length}</span></h3>
            <div className="grid gap-2">{items.map(i => (
              <div key={i.id} className="bg-white p-2 rounded border-l-4 border-indigo-400 shadow-sm flex gap-2">
                {batch && <div onClick={()=>toggleSel(i.id)} className={`w-5 h-5 border rounded flex items-center justify-center self-center ${sel.has(i.id)?'bg-red-500 border-red-500 text-white':''}`}>{sel.has(i.id)&&<Icons.Check className="w-3 h-3"/>}</div>}
                <div className="flex-1"><div className="flex justify-between"><span onClick={()=>!batch&&onSearch(i.name)} className="font-medium cursor-pointer">{i.name}</span>{!batch&&<div className="flex gap-2 text-gray-400"><Icons.Edit3 className="w-3.5 h-3.5 cursor-pointer" onClick={()=>onEdit(i)} /><Icons.Trash2 className="w-3.5 h-3.5 cursor-pointer text-red-300" onClick={()=>onDelete(i.id,i.name)} /></div>}</div><div className="text-xs text-gray-400 mt-1">{i.note && <span className="bg-gray-50 p-0.5 rounded mr-1">{i.note}</span>}{i.date}</div></div>
              </div>
            ))}</div>
          </div>
        )
      })}</div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"><div className="flex justify-between mb-4 border-b pb-2"><h3 className="text-xl font-bold">{title}</h3><button onClick={onClose}><Icons.X /></button></div>{children}</div></div>;
}
function EditForm({ initialData, onSave, onClose }) {
  const [d, setD] = useState(initialData);
  return <form onSubmit={e=>{e.preventDefault();onSave(d)}} className="space-y-4"><div><label className="text-sm block">名稱</label><input className="w-full border rounded p-2" value={d.name} onChange={e=>setD({...d,name:e.target.value})} /></div><div><label className="text-sm block">備註</label><textarea className="w-full border rounded p-2" value={d.note} onChange={e=>setD({...d,note:e.target.value})} /></div><label className="flex gap-2 text-sm"><input type="checkbox" checked={d.isCrossSeason} onChange={e=>setD({...d,isCrossSeason:e.target.checked})} /> 跨季</label><button className="w-full bg-indigo-600 text-white py-2 rounded">儲存</button></form>;
}
function RateForm({ item, onConfirm, onCancel }) {
  const [r, setR] = useState(5); const [n, setN] = useState(item.note||'');
  return <div className="space-y-4"><div><label className="block text-sm">評價</label><select value={r} onChange={e=>setR(Number(e.target.value))} className="w-full border rounded p-2">{RATING_TIERS.filter(t=>t.value!==-1).map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div><label className="block text-sm">備註</label><textarea value={n} onChange={e=>setN(e.target.value)} className="w-full border rounded p-2 h-24" /></div><div className="flex gap-2"><button onClick={onCancel} className="flex-1 py-2 bg-gray-100 rounded">取消</button><button onClick={()=>onConfirm(r,n)} className="flex-1 py-2 bg-green-600 text-white rounded">確認</button></div></div>;
}