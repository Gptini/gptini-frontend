import { RouterProvider } from 'react-router-dom'
import router from './router'
import ErrorModal from './components/common/ErrorModal'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ErrorModal />
    </>
  )
}

export default App
