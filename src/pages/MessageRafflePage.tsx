// MessageRafflePage.tsx
import { useEffect, useRef, useState } from "react"
import { db } from "../lib/firebase"
import { onValue, ref } from "firebase/database"
import { motion } from "framer-motion"
import { LoadingModal } from "../components/LoadingComponents"
import banner from '../assets/images/banner.png'
import close from "../assets/images/close.png"

type Message = {
  id: string
  name: string
  lineDisplayname: string
  text: string
  createdAt: number
}

export default function MessageRafflePage() {
  // 🚨 這裡就是原本那整份抽獎程式碼的內容
  // （不用改邏輯，只是把 `export function` 改成 `export default function`）

  const [messages, setMessages] = useState<Message[]>([])
  // const [rafflePool, setRafflePool] = useState<Message[]>([])
  const [winnerList, setWinnerList] = useState<Message[]>([])

  const [hasStarted, setHasStarted] = useState(false)
  // const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [revealedWinner, setRevealedWinner] = useState<Message | null>(null)
  const rafflePoolRef = useRef<Message[]>([])
  const [isShuffling, setIsShuffling] = useState(false)
  const [fakeDisplay, setFakeDisplay] = useState<Message | null>(null)
  const [isOpenModel, setIsOpenModel] = useState(false)

  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const messagesRef = ref(db, "messages")
    const unsubscribe = onValue(messagesRef, snapshot => {
      const list: Message[] = []
      snapshot.forEach(child => {
        const v = child.val()
        list.push({
          id: child.key!,
          name: v.name ?? "",
          lineDisplayname: v.lineDisplayname ?? "",
          text: v.text ?? "",
          createdAt: v.createdAt ?? 0
        })
      })
      list.sort((a, b) => b.createdAt - a.createdAt)

      if (!hasStarted) setMessages(list)
        setIsLoading(false)
    })
    
    unsubscribeRef.current = unsubscribe
    return () => unsubscribe()
    
  }, [hasStarted])

  const handleStart = () => {
  // 鎖住資料來源
  setHasStarted(true);
  if (unsubscribeRef.current) {
    unsubscribeRef.current();
    unsubscribeRef.current = null;
  }

  rafflePoolRef.current = [...messages];

  console.log("已鎖住抽獎名單:", rafflePoolRef.current);
};
  const handleRaffle = () => {
    const pool = rafflePoolRef.current;

    if (pool.length === 0) {
      alert("抽獎池沒有剩餘的留言了！");
      return;
    }
    setIsOpenModel(true)
    // 🔥 1) 開始假滾動動畫
    setIsShuffling(true)

    let count = 0
    const shuffleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * pool.length)
      setFakeDisplay(pool[randomIndex])
      count++
    }, 80)  // ← 每 80ms 換一個名字

    // 🔥 2) 停止假滾動 → 揭曉真正 winner
    setTimeout(() => {
      clearInterval(shuffleInterval)
      setIsShuffling(false)

      // 🔥（以下是你原本的邏輯）
      const index = Math.floor(Math.random() * pool.length);
      const winner = pool[index];

      setRevealedWinner(winner);
      setWinnerList(prev => [...prev, winner]);
      rafflePoolRef.current = pool.filter(m => m.id !== winner.id);

    }, 1200) // ← 假滾動 1.2 秒後揭曉
  }


  return (
    <div className="bg-[#ebe9e6] min-h-screen relative">
      <img src={banner} className="mb-6 w-full max-w-[900px] mx-auto" alt="" />
      <div className="text-center mb-4">
        <button
          onClick={hasStarted ? handleRaffle : handleStart}
          className="start-btn px-6 py-3 rounded-full bg-[#534d46] shadow-xl text-white text-2xl"
        >
          {hasStarted ? "開始抽獎" : "截止抽獎名單"}
        </button>
      </div>
        {isOpenModel && (
          <div className="model bg-[#534d46]">
            {isShuffling && fakeDisplay && (
              <motion.div
                key="shuffle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center mb-6"
              >
                <div className="text-3xl font-bold text-white drop-shadow mb-2">
                  {fakeDisplay.name || fakeDisplay.lineDisplayname}
                </div>

                <div className="mx-auto max-w-md bg-white border border-[#e6d4b0] rounded-xl p-3 shadow">
                  <div className="text-[#5f554c] text-base leading-relaxed">
                    {fakeDisplay.text}
                  </div>
                </div>
              </motion.div>
            )}
            {!isShuffling && revealedWinner && (
              <>
              <div className="text-center mb-6 winner-card">
                <div className="text-5xl font-extrabold golden-flash mb-4 tracking-wide leading-relaxed">
                  {revealedWinner.name || revealedWinner.lineDisplayname}
                </div>

                {/* 留言內容卡片 */}
                <div className="mx-auto max-w-md bg-white border-4 border-[#e6d4b0] rounded-2xl p-5 shadow-lg">
                  <div className="text-[#6b5f52] text-lg leading-relaxed">
                    {revealedWinner.text}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpenModel(false)} className="absolute bottom-[20%] font-bold text-3xl w-[40px] h-[40px] p-3 bg-white text-[#272726] rounded-full flex items-center justify-center items-center">
                <img src={close} className="w-full" alt="Close" />
              </button>
              </>
            )}
          </div>
        )}
      <div className="px-4 pt-6 pb-12">
        <h2 className="text-[#0e0905] font-bold text-2xl mb-2 text-center">中獎名單</h2>
        <div className="bg-[#d3cdc4] p-4 rounded-2xl shadow-md mb-6 max-w-[900px] mx-auto">
          {winnerList.length === 0 ? (
            <div className="text-[#857d71]">目前尚無中獎者</div>
          ) : (
            <ul className="space-y-3 ">
              {winnerList.map(w => (
                <motion.li
                  key={w.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2"
                >
                  <div className="text-[#534d46] font-bold text-lg">
                    {w.name || w.lineDisplayname}
                  </div>
                  <div className="message bg-white rounded-lg px-2 py-1 text-sm text-[#534d46] text-left leading-relaxed">
                    {w.text}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <h2 className="text-[#0e0905] font-bold text-2xl mb-2 text-center">留言列表</h2>
        <div className="bg-[#d3cdc4] p-4 rounded-2xl shadow-md  max-w-[900px] mx-auto">
          <ul className="space-y-3">
            {messages.map(m => (
              <li key={m.id}>
                <div className="text-[#857d71] font-semibold text-lg">
                  {m.name || m.lineDisplayname}
                </div>
                <div className="message bg-white rounded-lg px-2 py-1 text-sm text-[#534d46] text-left leading-relaxed">
                  {m.text}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <LoadingModal show={isLoading} />
    </div>
  )
}
