"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [localStorageUser, setLocalStorageUser] = useState<string | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    setLocalStorageUser(savedUser)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Тест авторизации</h1>
        
        <div className="space-y-4">
          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">Состояние контекста авторизации:</h2>
            <p><strong>Loading:</strong> {loading ? 'Да' : 'Нет'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          </div>

          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">localStorage:</h2>
            <p><strong>User:</strong> {localStorageUser || 'null'}</p>
          </div>

          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">Действия:</h2>
            <button 
              onClick={() => {
                const savedUser = localStorage.getItem('user')
                setLocalStorageUser(savedUser)
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Обновить localStorage
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('user')
                setLocalStorageUser(null)
                window.location.reload()
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Очистить и перезагрузить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 