import './App.css'
import SidePanel from './components/SidePanel'
import MainCanvas from './components/MainCanvas'
import { FormProvider } from './context/formContext'
import { GlobalProvider } from './context/globalContext'

function App() {
  return (
    <>
      <GlobalProvider>
        <FormProvider>
          <div className='flex h-full'>
            <div className='flex-1 h-full'>
              <MainCanvas />
            </div>
            <SidePanel />
          </div>
        </FormProvider>
      </GlobalProvider>
    </>
  )
}

export default App
