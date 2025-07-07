import { useState } from 'react'
import './App.scss'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='counter'>
        <div className='count-text'>{count}</div>
        <div className='counter-buttons'>
          <div className='counter-button count' onClick={() => {setCount(count + 1)}}>Count</div>
          <div className='counter-button reset' onClick={() => {setCount(0)}}>Reset</div>
        </div>
      </div>
    </>
  )
}

export default App
