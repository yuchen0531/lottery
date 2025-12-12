import { useEffect, Suspense, lazy } from 'react'
import './App.css'
import { Routes, Route } from "react-router-dom"
const MessageRafflePage = lazy(() => import("./pages/MessageRafflePage"))

function App() {
  useEffect(() => {
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="overflow-auto">
        <Suspense fallback={
            <div className="flex justify-center items-center ">
            </div>
          }>
          <Routes>
              <Route path="/" element={<MessageRafflePage />} />
          </Routes>
        </Suspense>
      </div>
      
    </div>
  )
}

export default App
