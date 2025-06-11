import { useState } from 'react'
import './App.css'
import SidePanel from './components/SidePanel'
import MainCanvas from './components/MainCanvas'
import { FormProvider } from './context/formContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <FormProvider>
        <div className='flex h-full'>
          <div className='flex-1 h-full'>
            <MainCanvas />
          </div>
          <SidePanel />
        </div>
      </FormProvider>
    </>
  )
}

export default App
