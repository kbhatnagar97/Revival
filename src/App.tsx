import { useState } from 'react'
import './App.scss'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='counter'>
        <div className='count-text'>{count}</div>
        <div className='counter-buttons'>
          <button
            className='counter-button op-button decrement' 
            onClick={() => setCount(count - 1)}
            disabled={count === 0}
          >
            -
          </button>

          <button
            className='counter-button op-button increment' 
            onClick={() => setCount(count + 1)}
          >
            +
          </button>

          <button
            className='counter-button reset'
            onClick={() => setCount(0)}
          >
            Reset
          </button>
        </div>
      </div>
    </>
  )
}

export default App