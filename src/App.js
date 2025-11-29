import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase'; 
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  Plus, Check, Trash2, FolderPlus, PlayCircle, Save, Edit3, X, List, Folder, Clock, Trophy, ExternalLink, Dice5, Pencil, AlertTriangle, Search, ListChecks, LogOut, FilePlus 
} from 'lucide-react';

// --- 常數設定 ---
const COLLECTION_NAME = "anime_tracker_data";
const LOCAL_STORAGE_KEY = "anime_tracker_local_backup";

const Icons = { Plus, Check, Trash2, FolderPlus, PlayCircle, Save, Edit3, X, List, Folder, Clock, Trophy, ExternalLink, Dice5, Pencil, AlertTriangle, Search, ListChecks, LogOut, FilePlus };

// --- 評分資料來源 (保留您的完整清單) ---
const RATED_SOURCE = [
  {r:6, items:[
    "Lycoris Recoil 莉可麗絲 Friends are thieves of time",
    "藥師少女的獨語 第二季",
    "青春豬頭少年不會夢到聖誕服女郎",
    "薰香花朵凛然綻放",
    "Silent Witch 沉默魔女的秘密"
  ]},
  {r:5, items:[
    "青春之箱",
    "結緣甘神神社",
    "紫雲寺家的兄弟姊妹",
    "戀上換裝娃娃 第2季",
    "我們不可能成為戀人！絕對不行。（※似乎可行？）"
  ]},
  {r:4, items:[
    "黑岩目高不把我的可愛放在眼裡",
    "妻子變成小學生",
    "Love Live! Superstar!!",
    "只想告訴你",
    "群花綻放、彷如修羅",
    "我和班上最討厭的女生結婚了",
    "GATE 奇幻自衛隊",
    "天久鷹央的推理病歷表",
    "SAKAMOTO DAYS 坂本日常 第2季度"
  ]},
  {r:3, items:[
    "七大罪 啟示錄四騎士 第二季",
    "聽說你們要結婚",
    "轉生為第七王子",
    "版本日常學園",
    "默示錄",
    "我的幸福婚約 第二季",
    "炎炎消防隊 參之章 上半",
    "小市民系列 第二季",
    "男女之間存在純友情嗎？（不，不存在！）",
    "章魚嗶的原罪",
    "mono女孩",
    "隨興旅-That's Journey-",
    "盾之勇者成名錄 Season 4"
  ]},
  {r:2, items:[
    "最近的偵探這沒用",
    "忍者與殺手的兩人生活",
    "僕愛君愛",
    "未來日記",
    "雖然是公會的櫃檯小姐，但因為不想加班所以打算獨自討伐迷宮頭目",
    "歡迎光臨流放者食堂！"
  ]},
  {r:1, items:[
    "公爵千金的家庭教師",
    "精靈幻想記 第二季",
    "魔法光源股份有限公司",
    "時光沙漏MOMENTARY LILY",
    "剎那之花",
    "這個美術社大有問題"
  ]}
];

// --- 季節資料來源 (保留您的完整清單) ---
const SEASONAL_SOURCE = [
  {name:"2025 10月", items:[
    "SPY×FAMILY 間諜家家酒 第三季",
    "擁有超常技能的異世界流浪美食家 第二季",
    "一拳超人 第三季",
    "彈珠汽水瓶裡的千歲同學",
    "對我垂涎欲滴的非人少女",
    "我的英雄學院 FINAL SEASON",
    "朋友的妹妹只纏著我",
    "女騎士成為蠻族新娘",
    "這裡是充滿笑容的職場。",
    "機械女僕‧瑪麗",
    "不動聲色的柏田與喜形於色的太田",
    "野原廣志 午餐的流派",
    "跨越種族與你相戀",
    "永久的黃昏",
    "不擅吸血的吸血鬼",
    "不中用的前輩",
    "賽馬娘 灰髮灰姑娘 第二季度",
    "最後可以再拜託您一件事嗎"
  ]},
  {name:"2025 7月", items:[
    "章魚嗶的原罪",
    "戀上換裝娃娃 第2季",
    "Silent Witch 沉默魔女的秘密",
    "薰香花朵凛然綻放",
    "SAKAMOTO DAYS 坂本日常 第2季度",
    "青春豬頭少年不會夢到聖誕服女郎",
    "盾之勇者成名錄 Season 4",
    "轉生為第七王子，隨心所欲的魔法學習之路 第二季",
    "怪獸8號 第2季",
    "住在拔作島上的我該如何是好？",
    "我們不可能成為戀人！絕對不行。（※似乎可行？）",
    "渡同學的××瀕臨崩壞",
    "9-nine- Ruler's Crown",
    "BadGirl",
    "出租女友 第4季",
    "歡迎光臨流放者食堂！",
    "Dr.STONE 新石紀 SCIENCE FUTURE 第2季度",
    "和雨·和你",
    "膽大黨 第二季",
    "遊樂場少女的異文化交流",
    "公爵千金的家庭教師",
    "歌聲是法式千層酥",
    "最近的偵探這沒用"
  ]},
  {name:"2025 4月", items:[
    "持續狩獵史萊姆三百年，不知不覺就練到LV MAX 第二季",
    "WITCH WATCH 魔女守護者",
    "賽馬娘 シンデレラグレイ",
    "男女之間存在純友情嗎？（不，不存在！）",
    "小市民系列 第二季",
    "直至魔女消逝",
    "隨興旅-That's Journey-",
    "炎炎消防隊 參之章",
    "mono女孩",
    "九龍大眾浪漫",
    "因為太完美而不可愛而被解除婚約的聖女被賣到了鄰國",
    "記憶縫線YOUR FORMA",
    "Summer Pockets*",
    "紫雲寺家的兄弟姊妹",
    "忍者與殺手的兩人生活",
    "推理要在晚餐後",
    "在棒球場抓住我！",
    "愛有點沉重的暗黑精靈從異世界緊追不放",
    "前橋魔女",
    "這是妳與我的最後戰場，或是開創世界的聖戰 第二季",
    "快藏好！瑪奇娜同學！！",
    "拜託請穿上 鷹峰同學",
    "ツインズひなひま",
    "Lycoris Recoil 莉可麗絲 Friends are thieves of time"
  ]},
  {name:"2025 1月", items:[
    "我獨自升級 第二季",
    "藥師少女的獨語 第二季",
    "我的幸福婚約 第二季",
    "超超超超超喜歡你的100個女朋友 第2季",
    "新石紀 第四季",
    "異修羅 第2季",
    "天久鷹央的推理病歷表",
    "灰色：幻影扳機",
    "Bang Dream!Ave Mujica",
    "MOMENTARY LILY 剎那之花",
    "我和班上最討厭的女生結婚了",
    "一桿青空",
    "雖然是公會的櫃檯小姐，但因為不想加班所以打算獨自討伐迷宮頭目",
    "群花綻放、彷如修羅",
    "青春特調蜂蜜檸檬蘇打",
    "Unnamed Memory 無名記憶 Act.2",
    "在沖繩喜歡上的女孩子方言講太多太棘手了",
    "黑岩目高不把我的可愛放在眼裡",
    "歡迎來到日本，妖精小姐",
    "我與尼特女忍者的莫名同居生活",
    "這公司有我喜歡的人",
    "終究、還是會戀愛",
    "全修",
    "版本日常"
  ]},
  {name:"2024 10月", items:[
    "從零開始的異世界生活 第三季",
    "平凡職業造就世界最強 第三季（跨）",
    "地下城尋求邂逅",
    "香格里拉 第二季",
    "成為名留歷史的壞女人吧",
    "當不成魔法師的女孩",
    "結緣甘神神社（跨）",
    "精靈幻想記 第二季",
    "七大罪 啟示錄四騎士 第二季",
    "魔法光源股份有限公司",
    "常軌脫離",
    "Love Live! Superstar!! 第3季",
    "村井之戀",
    "聽說你們要結婚",
    "GOD.app第二季（神明選拔）",
    "青春之箱（跨）",
    "妻子變成小學生",
    "膽大黨"
  ]},
  {name:"2024 7月", items:[
    "我推的孩子",
    "不時輕聲地以俄語遮羞的鄰座艾莉同學",
    "敗北女角太多了",
    "小市民系列",
    "化成菜葉化成花",
    "義妹生活",
    "2.5次元的誘惑",
    "身為VTuber的我因為忘記關台而成了傳說",
    "模擬後宮體驗",
    "雙生戀情密不可分",
    "曾經、魔法少女和邪惡相互為敵。",
    "女神咖啡廳 第2季",
    "異世界失格",
    "地下城中的人",
    "少女如草花般綻放",
    "深夜中的一拳",
    "杖與劍的魔劍譚",
    "鹿乃子乃子乃子虎式單單"
  ]},
  {name:"2024 4月", items:[
    "轉生史萊姆第三季",
    "鬼滅之刃柱訓練",
    "魔法科高校的劣等生第三季",
    "為美好世界獻上祝福第三季",
    "無職轉生第二季下半",
    "蔚藍檔案",
    "神明渴求著遊戲",
    "聲優廣播的幕前幕後",
    "搖曳露營第三季",
    "我的英雄學院第七季",
    "魔王學院的不適任著第二季下半",
    "身為魔王的我娶了奴隸精靈為妻",
    "夜晚的水母不會游泳",
    "老夫老妻重返未來",
    "恰如細雨般的戀歌",
    "花野井同學與戀愛病",
    "單人房、日照一般、附天使",
    "怪獸8號"
  ]},
  {name:"2024 1月", items:[
    "歡迎來到實力至上主義教室第三季",
    "肌肉魔法使第二季",
    "我內心的糟糕念頭第二季",
    "公主殿下，拷問的時間到了",
    "異修羅",
    "愚蠢天使與惡魔共舞",
    "反派千金等級99",
    "輪迴第七次的惡役令孃",
    "弱角友棋同學第二季",
    "夢想成為魔法少女",
    "指尖相處 戀戀不捨",
    "北海道辣妹金古錐",
    "治癒魔法的錯誤使用法",
    "秒殺外掛太強了",
    "婚戒物語",
    "魔都精兵的奴隸",
    "迷宮飯（跨）",
    "月光下的異世界之旅（跨）",
    "我獨自升級",
    "異世界溫泉"
  ]},
  {name:"2023 10月", items:[
    "進擊的巨人 完結後篇",
    "賽馬娘 第三季",
    "我想成為影之強者 第二季",
    "盾之勇者 第三季",
    "新石季 第二季",
    "屍體如山的死亡遊戲 第二季",
    "七大罪 啟示錄",
    "轉生史萊姆 外傳",
    "間諜家家酒 第二季",
    "藥師少女的獨語",
    "葬送的芙莉蓮",
    "位於戀愛光譜極端的我們",
    "超超超超超喜歡你的100個女朋友",
    "家裡蹲吸血姬的鬱悶",
    "凹凸魔女的親子日常",
    "聖劍學院的魔劍使",
    "16bit 的感動 ANOTHER LAYER"
  ]},
  {name:"2023 7月", items:[
    "無職轉生第二季",
    "咒術第二季",
    "堀與宮村",
    "政宗君的復仇第二季",
    "我喜歡的女孩忘記帶眼鏡",
    "七魔劍支配天下",
    "其實我乃最強",
    "謊言遊戲",
    "出租女友第三季",
    "死神少爺與黑女僕第二季",
    "夢懷美夢的少年是現實主義者",
    "公司的小小前輩",
    "成為悲劇元兇的最強異端，最後頭目女王為了人民犧牲奉獻",
    "黑暗集會",
    "間諜教室 第二季",
    "妙廟美少女",
    "五等分的花架",
    "殭屍100",
    "Fate",
    "我的幸福婚約"
  ]},
  {name:"2023 4月", items:[
    "鬼滅之刃",
    "新石紀",
    "熊熊勇闖異世界",
    "賽馬娘",
    "總之就是很可愛",
    "為這個世界獻上爆炎",
    "肌肉魔法使",
    "我推的孩子",
    "勇者死了",
    "第二次被異世界召喚",
    "在異世界得到超強能力的我，到現實這樣無敵",
    "轉生貴族的異世界冒險錄",
    "我內心的可怕念頭",
    "和山田君談場LV999的戀愛",
    "女神咖啡廳",
    "鄰人似銀河",
    "百合是我的工作"
  ]},
  {name:"2023 1月", items:[
    "怕痛的我把防禦力點滿",
    "不要欺負我 長靜同學",
    "魔王學員的不適認者",
    "地錯",
    "總神眷顧",
    "虛構推理",
    "間諜教室",
    "擁有超常技能的異世界流浪美食家",
    "久保同學不放過我",
    "不當歐尼講",
    "冰屬性男子與無表情女王",
    "傲嬌反派千金立傑洛特",
    "為了養老金去異世界存八萬金",
    "關於我在無意間被隔壁的天使變成廢材這件事",
    "最強陰陽師異世界轉生記"
  ]}
];

const RATING_TIERS = [
  {label:'⭐️⭐️⭐️⭐️⭐️⭐️ (神作)',value:6},
  {label:'⭐️⭐️⭐️⭐️⭐️ (必看)',value:5},
  {label:'⭐️⭐️⭐️⭐️ (推薦)',value:4},
  {label:'⭐️⭐️⭐️ (普通)',value:3},
  {label:'⭐️⭐️ (微妙)',value:2},
  {label:'⭐️ (雷作)',value:1},
  {label:'其他 (未評價)',value:-1}, 
  {label:'放棄 (棄番)',value:0}
];

const normalize = (str) => str.replace(/[\s\u3000]/g, '').replace(/[（(].*?[)）]/g, '').replace(/[*^_^]/g, '').toLowerCase();

// --- 初始資料產生器 (含自動分類邏輯) ---
const generateInitialData = () => {
  const history = [], seasonal = [], toWatch = [];
  const historyMap = new Set();

  // 1. 處理評分紀錄
  RATED_SOURCE.forEach(tier => tier.items.forEach(name => { 
    const cleanName = name.replace(/\(.*\)|（.*）|\*|^_^/g, '').trim();
    const normName = normalize(cleanName);
    
    if (!historyMap.has(normName)) {
      history.push({
          id:`h-${Math.random().toString(36).substr(2,9)}`,
          name: cleanName,
          rating: tier.r,
          note: name.includes('需補') ? '需補前作' : '',
          date: new Date().toISOString().split('T')[0],
          isCrossSeason: false
      });
      historyMap.add(normName);
    }
  }));

  // 2. 處理季節列表
  SEASONAL_SOURCE.forEach((s, i) => {
    const items = s.items.map((n, j) => {
      const isCross = n.includes('（跨）') || n.includes('(跨)');
      const clean = n.replace(/\(.*\)|（.*）|\*|^_^/g, '').trim();
      return {
          id:`s-${i}-${j}-${Math.random().toString(36).substr(2,5)}`,
          name:clean,
          note: n !== clean ? n.replace(clean, '').replace(/[()（）]/g,'').trim() : '',
          isCrossSeason: isCross
      };
    });
    seasonal.push({id:`folder-${i}`,name:s.name,items});

    if (s.name === "2025 10月") {
       items.forEach(item => {
         toWatch.push({
            id: `tw-${Math.random().toString(36).substr(2,9)}`,
            name: item.name,
            note: item.note,
            isCrossSeason: item.isCrossSeason
         });
       });
    } else {
       items.forEach(item => {
          const normName = normalize(item.name);
          if (!historyMap.has(normName)) {
             history.push({
                id:`h-auto-${Math.random().toString(36).substr(2,9)}`,
                name: item.name,
                rating: -1, // 未評價
                note: item.note,
                date: new Date().toISOString().split('T')[0],
                isCrossSeason: item.isCrossSeason
             });
             historyMap.add(normName);
          }
       });
    }
  });

  return {toWatch, seasonal, history, lastUpdated: Date.now()};
};

export default function App() {
  const [activeTab, setActiveTab] = useState('towatch');
  
  // --- 安全讀取資料 ---
  const [data, setDataState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed.toWatch) || !Array.isArray(parsed.seasonal) || !Array.isArray(parsed.history)) {
          console.warn("本地資料結構損壞，重置為預設值");
          return generateInitialData();
        }
        return parsed;
      }
    } catch (e) {
      console.error("資料讀取失敗，重置為預設值", e);
    }
    return generateInitialData();
  });
  
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
            const cloudData = docSnap.data();
            const safeData = {
                toWatch: cloudData.toWatch || [],
                seasonal: cloudData.seasonal || [],
                history: cloudData.history || [],
                lastUpdated: cloudData.lastUpdated || 0
            };

            let localTime = 0;
            try {
                const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (localRaw) {
                    localTime = JSON.parse(localRaw).lastUpdated || 0;
                }
            } catch(e) {}

            if (localTime > safeData.lastUpdated + 2000) {
               console.log("本地資料較新，強制補上傳...");
               const currentLocalData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
               setDoc(docRef, currentLocalData).catch(console.error);
            } else {
               setDataState(safeData);
               localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeData));
            }
          } else {
            setDoc(docRef, data);
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

    getRedirectResult(auth).catch(e => setAuthError(e.message));
    return () => unsubAuth();
  }, []); 

  // --- Update Data Helper ---
  const updateData = (newDataOrUpdater) => {
    setDataState((prevData) => {
      let newData;
      if (typeof newDataOrUpdater === 'function') {
        newData = newDataOrUpdater(prevData);
      } else {
        newData = newDataOrUpdater;
      }

      // 極端防護：確保資料完整性
      if (!newData || !Array.isArray(newData.seasonal)) {
          console.error("更新失敗：資料異常", newData);
          return prevData;
      }

      const dataWithTimestamp = { ...newData, lastUpdated: Date.now() };
      
      try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataWithTimestamp));
          if (user) {
            setDoc(doc(db, "users", user.uid, COLLECTION_NAME, "main"), dataWithTimestamp).catch(console.error);
          }
      } catch (err) {
          console.error("儲存失敗", err);
      }

      return dataWithTimestamp;
    });
  };

  // --- Auth Actions ---
  const login = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    setIsProcessing(true);
    try {
      await signInWithPopup(auth, provider);
      setIsProcessing(false);
    } catch (error) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try { await signInWithRedirect(auth, provider); } catch(e) { setAuthError(e.message); setIsProcessing(false); }
      } else {
        setAuthError(error.message);
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
    updateData(prev => {
        const newData = { ...prev };
        if (type === 'towatch') newData.toWatch = newData.toWatch.filter(i => i.id !== id);
        else if (type === 'history') newData.history = newData.history.filter(i => i.id !== id);
        else if (type === 'seasonal') {
          const fIdx = newData.seasonal.findIndex(f => f.id === folderId);
          if (fIdx > -1) newData.seasonal[fIdx].items = newData.seasonal[fIdx].items.filter(i => i.id !== id);
        }
        return newData;
    });
    setDeletingItem(null);
  };

  const saveEdit = (item) => {
    const { type, listId, folderId } = editingItem;
    updateData(prev => {
        const newData = { ...prev };
        if (type === 'towatch') newData.toWatch = newData.toWatch.map(i => i.id === listId ? { ...i, ...item } : i);
        else if (type === 'history') newData.history = newData.history.map(i => i.id === listId ? { ...i, ...item } : i);
        else if (type === 'seasonal') {
          const fIdx = newData.seasonal.findIndex(f => f.id === folderId);
          if (fIdx > -1) newData.seasonal[fIdx].items = newData.seasonal[fIdx].items.map(i => i.id === listId ? { ...i, ...item } : i);
        }
        return newData;
    });
    setEditingItem(null);
  };

  const confirmRate = (rating, note) => {
    const { item, source } = rateModal;
    const normName = normalize(item.name);
    
    updateData(prev => {
        const newData = { ...prev };
        newData.history = [{...item, id:`h-${Date.now()}`, rating, note, date:new Date().toISOString().split('T')[0]}, ...newData.history];
        if (source === 'towatch') newData.toWatch = newData.toWatch.filter(i => i.id !== item.id);
        else if (source === 'seasonal') newData.toWatch = newData.toWatch.filter(i => normalize(i.name) !== normName);
        return newData;
    });
    
    setRateModal({ isOpen: false, item: null });
  };

  const performReset = () => {
    updateData(generateInitialData());
    setResetConfirm(false);
  };

  // --- Render ---
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">載入中...</div>;
  if (!user && !data) return (
    <LoginScreen login={login} error={authError} processing={isProcessing} />
  );

  return (
    <div className="min-h-screen pb-24 bg-[#f9fafb] text-gray-800 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <nav className="bg-indigo-600 text-white shadow-md sticky top-0 z-50 pt-[env(safe-area-inset-top)] -mt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <h1 className="font-bold flex items-center gap-2"><Icons.PlayCircle className="w-5 h-5"/> 動漫追番</h1>
            <div className="flex items-center gap-3">
              {user ? (
                 <>
                  {user.photoURL && <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full border border-white/30" />}
                  <button onClick={()=>signOut(auth)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">登出</button>
                 </>
              ) : (
                <button onClick={login} className="text-xs bg-white text-indigo-600 font-bold px-3 py-1 rounded">登入同步</button>
              )}
              <button onClick={()=>setResetConfirm(true)} className="text-xs bg-indigo-800 hover:bg-indigo-900 px-2 py-1 rounded">重置資料</button>
            </div>
          </div>
          <div className="flex space-x-1 pb-0 overflow-x-auto hide-scrollbar">
            {[{id:'towatch', label:'待看清單', icon:Icons.List}, {id:'seasonal', label:'各季新番', icon:Icons.Folder}, {id:'history', label:'觀看紀錄', icon:Icons.Clock}].map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${activeTab===tab.id ? 'bg-[#f9fafb] text-indigo-600' : 'text-indigo-100 hover:bg-white/10'}`}>
                <tab.icon className="w-4 h-4"/> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-3">
        {/* 主要修復點：移除多餘的包裝函數，直接傳遞 updateData */}
        {activeTab === 'towatch' && <ToWatchView list={data?.toWatch || []} onUpdate={updateData} onSearch={handleGoogleSearch} onDelete={(id, name)=>requestDelete('towatch', id, name)} onEdit={(item)=>setEditingItem({type:'towatch', listId:item.id, item})} onRate={(item)=>setRateModal({isOpen:true, item, source:'towatch'})} />}
        
        {activeTab === 'seasonal' && <SeasonalView data={data?.seasonal || []} history={data?.history || []} onUpdate={updateData} onImport={(items)=>updateData(prev=>({...prev, toWatch:[...prev.toWatch, ...items]}))} onSearch={handleGoogleSearch} onDelete={(id, name, fid)=>requestDelete('seasonal', id, name, fid)} onEdit={(item, fid)=>setEditingItem({type:'seasonal', listId:item.id, item, folderId:fid})} onRate={(item)=>setRateModal({isOpen:true, item, source:'seasonal'})} />}
        
        {activeTab === 'history' && <HistoryView list={data?.history || []} onUpdate={updateData} onSearch={handleGoogleSearch} onDelete={(id, name)=>requestDelete('history', id, name)} onEdit={(item)=>setEditingItem({type:'history', listId:item.id, item})} />}
      </main>

      <div className="fixed bottom-2 left-0 right-0 text-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <span className="text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur">v2.3 ● {user ? '已連線' : '本地模式'}</span>
      </div>

      {editingItem && <Modal title="編輯" onClose={()=>setEditingItem(null)}><EditForm initialData={editingItem.item} onSave={saveEdit} onClose={()=>setEditingItem(null)} /></Modal>}
      {deletingItem && <Modal title="刪除確認" onClose={()=>setDeletingItem(null)}><div className="text-center p-4"><p className="mb-4">確定刪除「{deletingItem.name}」？</p><div className="flex gap-2"><button onClick={()=>setDeletingItem(null)} className="flex-1 py-2 bg-gray-100 rounded">取消</button><button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded">刪除</button></div></div></Modal>}
      {rateModal.isOpen && <Modal title={`完食評分：${rateModal.item.name}`} onClose={()=>setRateModal({isOpen:false})}><RateForm item={rateModal.item} onConfirm={confirmRate} onCancel={()=>setRateModal({isOpen:false})} /></Modal>}
      {resetConfirm && <Modal title="重置確認" onClose={()=>setResetConfirm(false)}><div className="text-center p-4"><p className="mb-4 text-red-600 font-bold">警告：這會刪除目前紀錄，並還原成您剛剛提供的完整清單。</p><div className="flex gap-2"><button onClick={()=>setResetConfirm(false)} className="flex-1 py-2 bg-gray-100 rounded">取消</button><button onClick={performReset} className="flex-1 py-2 bg-red-600 text-white rounded">確認還原</button></div></div></Modal>}
    </div>
  );
}

// --- Login Screen ---
function LoginScreen({ login, error, processing }) {
  return (
    <div className="flex flex-col h-screen items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-lg border border-white/20 text-center w-full max-w-sm shadow-xl">
        <Icons.PlayCircle className="w-16 h-16 mx-auto mb-4 text-white/80" />
        <h1 className="text-2xl font-bold mb-2">追番君 Sync</h1>
        <p className="text-white/60 mb-8 text-sm">登入以同步您的追番進度</p>
        {error && <div className="bg-red-500/20 p-3 rounded text-xs text-red-100 mb-4 text-left break-words">{error}</div>}
        <button onClick={login} disabled={processing} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
          {processing ? '處理中...' : '使用 Google 登入'}
        </button>
      </div>
    </div>
  );
}

// --- Views & Components ---

function ToWatchView({ list, onUpdate, onSearch, onDelete, onEdit, onRate }) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isCross, setIsCross] = useState(false);
  const [gachaResult, setGachaResult] = useState(null);

  const add = (e) => {
    e.preventDefault();
    if(!name.trim()) return;
    onUpdate(p => ({...p, toWatch:[{id:Date.now().toString(), name, note, isCrossSeason:isCross}, ...p.toWatch]}));
    setName(''); setNote(''); setIsCross(false);
  };
  
  const gacha = () => { if(!list.length) return alert("清單是空的！"); setGachaResult(list[Math.floor(Math.random()*list.length)]); };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
        <h3 className="font-bold text-indigo-600 flex items-center gap-2"><Icons.Plus className="w-5 h-5"/> 新增待看</h3>
        <input className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-100" placeholder="動漫名稱" value={name} onChange={e=>setName(e.target.value)} />
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-100" placeholder="備註 (選填)" value={note} onChange={e=>setNote(e.target.value)} />
          <label className="flex items-center gap-1 bg-gray-50 px-3 rounded-lg border cursor-pointer select-none">
            <input type="checkbox" checked={isCross} onChange={e=>setIsCross(e.target.checked)} className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-gray-600">跨季</span>
          </label>
        </div>
        <button onClick={add} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95">加入清單</button>
      </div>

      <div className="flex justify-end">
         <button onClick={gacha} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold transform transition active:scale-95">
           <Icons.Dice5 className="w-5 h-5"/> 隨機抽選
         </button>
      </div>

      <div className="space-y-3">
        {list.length === 0 && <div className="text-center text-gray-400 py-10">目前沒有待看項目</div>}
        {list.map(i => (
        <div key={i.id} className="bg-white p-4 rounded-xl border shadow-sm flex gap-4 items-start group">
          <div className="pt-1"><button onClick={()=>onRate(i)} className="w-6 h-6 border-2 border-gray-300 rounded hover:border-green-500 hover:bg-green-50 transition-colors"></button></div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span onClick={()=>onSearch(i.name)} className="text-lg font-bold text-gray-800 cursor-pointer hover:text-indigo-600 leading-tight">{i.name}</span>
              <div className="flex gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.Edit3 className="w-5 h-5 text-gray-400 hover:text-indigo-500 cursor-pointer" onClick={()=>onEdit(i)} />
                <Icons.Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer" onClick={()=>onDelete(i.id, i.name)} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {i.isCrossSeason && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold">跨季</span>}
              <span className="text-sm text-gray-500">{i.note || "無備註"}</span>
            </div>
          </div>
        </div>
      ))}</div>

      {gachaResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[bounce_0.5s_ease-out]">
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 text-center">
               <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-md">
                 <Icons.Trophy className="w-7 h-7 text-white" />
               </div>
               <h3 className="text-xl font-bold text-white tracking-wider">抽選優勝</h3>
            </div>
            <div className="p-8 text-center">
              <div className="text-3xl font-bold text-gray-800 mb-8 break-words leading-tight">{gachaResult.name}</div>
              <button onClick={()=>setGachaResult(null)} className="w-full bg-[#1e293b] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg">
                決定就是你了！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeasonalView({ data, history, onUpdate, onImport, onSearch, onDelete, onEdit, onRate }) {
  const [term, setTerm] = useState('');
  const [exp, setExp] = useState({});
  const [batch, setBatch] = useState(false);
  const [sel, setSel] = useState(new Set());
  const [newFolderName, setNewFolderName] = useState('');

  const filtered = useMemo(() => {
    if(!term) return data;
    const t = term.toLowerCase();
    return data.map(f => ({...f, items: f.items.filter(i => i.name.toLowerCase().includes(t))})).filter(f => f.items.length > 0);
  }, [data, term]);
  
  const isWatched = (n) => history.some(h => h.name.replace(/\s/g,'') === n.replace(/\s/g,''));
  const toggleSel = (id) => { const s = new Set(sel); if(s.has(id)) s.delete(id); else s.add(id); setSel(s); };
  
  const toggleSelectAll = () => {
    const visibleIds = filtered.flatMap(f => f.items.map(i => i.id));
    if (visibleIds.every(id => sel.has(id))) setSel(new Set());
    else setSel(new Set(visibleIds));
  };

  // 使用 prev.seasonal 來確保更新安全
  const delSel = () => { if(window.confirm(`刪除 ${sel.size} 項?`)) { onUpdate(prev => ({...prev, seasonal: (prev.seasonal||[]).map(f => ({...f, items: f.items.filter(i => !sel.has(i.id))}))})); setSel(new Set()); setBatch(false); } };
  const add = (fid, name, note, isCross) => onUpdate(prev => ({...prev, seasonal: (prev.seasonal||[]).map(f => f.id===fid ? {...f, items:[{id:Date.now().toString(), name, note, isCrossSeason:isCross}, ...f.items]} : f)}));
  
  // 修正：這裡使用了安全的 prev.seasonal
  const createFolder = () => { if(!newFolderName.trim()) return; onUpdate(prev => ({...prev, seasonal: [{id:`folder-${Date.now()}`, name:newFolderName, items:[]} ,...(prev.seasonal||[])]})); setNewFolderName(''); };

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-lg border flex gap-2 items-center sticky top-14 z-10 shadow-sm">
        {batch ? (
          <div className="flex justify-between w-full items-center px-1">
             <div className="flex items-center gap-2">
                <button onClick={toggleSelectAll} className="text-xs bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200">
                    {filtered.flatMap(f => f.items).length > 0 && filtered.flatMap(f => f.items).every(i => sel.has(i.id)) ? '取消全選' : '全選'}
                </button>
                <span className="text-sm text-gray-500">已選 {sel.size}</span>
             </div>
             <div className="flex gap-2">
               <button onClick={delSel} className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1 rounded" disabled={!sel.size}>刪除</button>
               <button onClick={()=>{setBatch(false);setSel(new Set())}} className="text-gray-500 text-sm px-2">取消</button>
             </div>
          </div>
        ) : (
          <><Icons.Search className="text-gray-400 w-4 h-4"/><input placeholder="搜尋..." className="flex-1 outline-none text-sm" value={term} onChange={e=>setTerm(e.target.value)} /><button onClick={()=>setBatch(true)} className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"><Icons.ListChecks className="w-4 h-4"/></button></>
        )}
      </div>

      {!batch && !term && (
        <div className="bg-white p-3 rounded-lg border flex gap-2 shadow-sm">
          <div className="flex items-center text-indigo-500 pl-1"><Icons.FolderPlus className="w-5 h-5"/></div>
          <input className="flex-1 border-none outline-none text-sm" placeholder="新增季節資料夾" value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} />
          <button onClick={createFolder} className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded font-bold">新增</button>
        </div>
      )}

      <div className="space-y-3">{filtered.map(f => {
        const open = term || batch || exp[f.id];
        const watched = f.items.filter(i=>isWatched(i.name)).length;
        const sorted = [...f.items].sort((a,b) => (isWatched(a.name)===isWatched(b.name)?0:isWatched(a.name)?1:-1));
        return (
          <div key={f.id} className="bg-white rounded-lg border overflow-hidden shadow-sm transition-all">
            <div onClick={()=>!term&&!batch&&setExp(p=>({...p,[f.id]:!p[f.id]}))} className="flex justify-between p-4 bg-white border-b border-gray-100 text-sm font-bold cursor-pointer hover:bg-gray-50 items-center">
              <div className="flex items-center gap-3">
                 <span className={`text-gray-400 transition-transform ${open?'rotate-180':''}`}><Icons.Folder className={`w-5 h-5 ${open?'text-indigo-500':''}`}/></span>
                 <span className="text-lg text-gray-700">{f.name}</span>
                 <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">{watched}/{f.items.length}</span>
              </div>
              {!term && !batch && <button onClick={(e)=>{e.stopPropagation();onImport(f.items)}} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded text-xs hover:bg-blue-100"><Icons.Save className="w-3 h-3"/> 匯入待看</button>}
            </div>
            
            {open && <div className="p-4 bg-gray-50/50">
              {!batch && !term && <AddSeasonalItemForm onAdd={(n, note, c)=>add(f.id,n,note,c)} />}
              
              <div className="space-y-2 mt-3">{sorted.map(i => (
                <div key={i.id} className={`flex gap-3 p-3 rounded-lg border text-sm items-center transition-all ${isWatched(i.name)?'bg-green-50/80 border-green-200':'bg-white hover:border-indigo-300'}`}>
                  <div>{batch ? <div onClick={()=>toggleSel(i.id)} className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer ${sel.has(i.id)?'bg-red-500 border-red-500 text-white':''}`}>{sel.has(i.id)&&<Icons.Check className="w-3 h-3"/>}</div> : (isWatched(i.name)?<Icons.Check className="w-5 h-5 text-green-600"/>:<button onClick={()=>onRate(i)} className="w-5 h-5 border-2 rounded hover:border-green-500 transition-colors"></button>)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <span onClick={()=>!batch&&onSearch(i.name)} className={`font-medium cursor-pointer truncate ${isWatched(i.name)?'text-gray-500 line-through':''}`}>{i.name}</span>
                        {!batch&&<div className="flex gap-2 text-gray-400 opacity-60 hover:opacity-100"><Icons.Edit3 className="w-4 h-4 cursor-pointer" onClick={()=>onEdit(i,f.id)} /><Icons.Trash2 className="w-4 h-4 cursor-pointer text-red-300 hover:text-red-500" onClick={()=>onDelete(i.id,i.name,f.id)} /></div>}
                    </div>
                    <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                        {i.isCrossSeason && <span className="text-purple-600 bg-purple-100 px-1 rounded">跨</span>}
                        <span className="truncate">{i.note}</span>
                    </div>
                  </div>
                </div>
              ))}</div>
            </div>}
          </div>
        )
      })}</div>
    </div>
  );
}

function AddSeasonalItemForm({ onAdd }) {
    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [isCross, setIsCross] = useState(false);
    return (
        <form onSubmit={e=>{e.preventDefault();if(name.trim()){onAdd(name,note,isCross);setName('');setNote('');setIsCross(false);}}} className="border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-col sm:flex-row gap-2 items-center bg-gray-50">
            <input className="flex-1 bg-transparent outline-none border-b sm:border-none p-1 text-sm w-full" placeholder="新番名稱" value={name} onChange={e=>setName(e.target.value)} />
            <input className="flex-1 bg-transparent outline-none border-b sm:border-none p-1 text-sm w-full" placeholder="備註" value={note} onChange={e=>setNote(e.target.value)} />
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer"><input type="checkbox" checked={isCross} onChange={e=>setIsCross(e.target.checked)} /> 跨季</label>
                <button className="bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded font-bold">新增</button>
            </div>
        </form>
    );
}

function HistoryView({ list, onUpdate, onSearch, onDelete, onEdit }) {
  const [term, setTerm] = useState('');
  const [batch, setBatch] = useState(false);
  const [sel, setSel] = useState(new Set());
  
  const filtered = useMemo(() => term ? list.filter(i => i.name.toLowerCase().includes(term.toLowerCase())) : list, [list, term]);
  const groups = useMemo(() => { const g={}; RATING_TIERS.forEach(t=>g[t.value]=[]); filtered.forEach(i=>{ const r=i.rating??0; if(g[r]) g[r].push(i); }); return g; }, [filtered]);
  
  const toggleSel = (id) => { const s = new Set(sel); if(s.has(id)) s.delete(id); else s.add(id); setSel(s); };
  const toggleSelectAll = () => {
    const visibleIds = filtered.map(i => i.id);
    if (visibleIds.every(id => sel.has(id))) setSel(new Set());
    else setSel(new Set(visibleIds));
  };
  // 使用 prev.history 確保安全
  const delSel = () => { if(window.confirm(`刪除 ${sel.size} 項?`)) { onUpdate(prev => ({...prev, history: (prev.history||[]).filter(i => !sel.has(i.id))})); setSel(new Set()); setBatch(false); } };

  return (
    <div className="space-y-4">
       <div className="bg-white p-2 rounded-lg border flex gap-2 items-center sticky top-14 z-10 shadow-sm">
        {batch ? (
          <div className="flex justify-between w-full items-center px-1">
             <div className="flex items-center gap-2">
                <button onClick={toggleSelectAll} className="text-xs bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200">
                    {filtered.length > 0 && filtered.every(i => sel.has(i.id)) ? '取消' : '全選'}
                </button>
                <span className="text-sm text-gray-500">已選 {sel.size}</span>
             </div>
             <div className="flex gap-2">
               <button onClick={delSel} className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1 rounded" disabled={!sel.size}>刪除</button>
               <button onClick={()=>{setBatch(false);setSel(new Set())}} className="text-gray-500 text-sm px-2">取消</button>
             </div>
          </div>
        ) : (
          <><Icons.Search className="text-gray-400 w-4 h-4"/><input placeholder="搜尋紀錄..." className="flex-1 outline-none text-sm" value={term} onChange={e=>setTerm(e.target.value)} /><button onClick={()=>setBatch(true)} className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"><Icons.ListChecks className="w-4 h-4"/></button></>
        )}
      </div>

      <div className="space-y-6 pb-10">{RATING_TIERS.map(t => {
        const items = groups[t.value]||[]; if(!items.length) return null;
        return (
          <div key={t.value}>
            {/* 加大加深的標題樣式 */}
            <h3 className="font-bold text-indigo-800 border-b-2 border-indigo-100 mb-4 pb-2 flex justify-between items-end mt-8">
              <span className="text-xl">{t.label}</span>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{items.length}</span>
            </h3>
            <div className="grid gap-2">{items.map(i => (
              <div key={i.id} className="bg-white p-3 rounded-lg border-l-4 border-indigo-500 shadow-sm flex gap-3 hover:shadow-md transition-shadow">
                {batch && <div onClick={()=>toggleSel(i.id)} className={`w-5 h-5 border rounded flex items-center justify-center self-center cursor-pointer ${sel.has(i.id)?'bg-red-500 border-red-500 text-white':''}`}>{sel.has(i.id)&&<Icons.Check className="w-3 h-3"/>}</div>}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span onClick={()=>!batch&&onSearch(i.name)} className="font-medium cursor-pointer text-gray-800 hover:text-indigo-600 truncate">{i.name}</span>
                        {!batch&&<div className="flex gap-2 text-gray-400"><Icons.Edit3 className="w-4 h-4 cursor-pointer hover:text-indigo-500" onClick={()=>onEdit(i)} /><Icons.Trash2 className="w-4 h-4 cursor-pointer text-red-300 hover:text-red-500" onClick={()=>onDelete(i.id,i.name)} /></div>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex gap-2">
                        <span>{i.date}</span>
                        {i.note && <span className="bg-gray-100 px-1 rounded truncate max-w-[150px]">{i.note}</span>}
                    </div>
                </div>
              </div>
            ))}</div>
          </div>
        )
      })}</div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"><div className="flex justify-between mb-4 border-b pb-2"><h3 className="text-xl font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.X /></button></div>{children}</div></div>;
}

function EditForm({ initialData, onSave, onClose }) {
  const [d, setD] = useState(initialData);
  return <form onSubmit={e=>{e.preventDefault();onSave(d)}} className="space-y-4"><div><label className="text-sm block text-gray-600 mb-1">名稱</label><input className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-100 outline-none" value={d.name} onChange={e=>setD({...d,name:e.target.value})} /></div><div><label className="text-sm block text-gray-600 mb-1">備註</label><textarea className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-100 outline-none" value={d.note} onChange={e=>setD({...d,note:e.target.value})} /></div><label className="flex gap-2 text-sm text-gray-700 items-center"><input type="checkbox" className="w-4 h-4 text-indigo-600" checked={d.isCrossSeason} onChange={e=>setD({...d,isCrossSeason:e.target.checked})} /> 跨季追番</label><button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold shadow transition-colors">儲存變更</button></form>;
}

function RateForm({ item, onConfirm, onCancel }) {
  const [r, setR] = useState(5); const [n, setN] = useState(item.note||'');
  return <div className="space-y-4"><div className="bg-indigo-50 p-3 rounded mb-2"><h4 className="font-bold text-indigo-900">{item.name}</h4></div><div><label className="block text-sm text-gray-600 mb-1">評價等級</label><select value={r} onChange={e=>setR(Number(e.target.value))} className="w-full border rounded p-2 outline-none">{RATING_TIERS.filter(t=>t.value!==-1).map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div><label className="block text-sm text-gray-600 mb-1">完食心得/備註</label><textarea value={n} onChange={e=>setN(e.target.value)} className="w-full border rounded p-2 h-24 resize-none outline-none focus:ring-2 focus:ring-indigo-100" placeholder="寫點什麼..." /></div><div className="flex gap-2 pt-2"><button onClick={onCancel} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded font-bold hover:bg-gray-200">取消</button><button onClick={()=>onConfirm(r,n)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow">確認提交</button></div></div>;
}