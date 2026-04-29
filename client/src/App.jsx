import { Outlet } from "react-router"
import { Toaster } from 'react-hot-toast'
function App() {

  return (
    <>
      <div>
        <Outlet></Outlet>
        <Toaster/>
      </div>
    </>
  )
}

export default App
