import { Viewport } from './components/Viewport'
import { MediaProvider } from './components/MediaProvider'
import { ControlPanel } from './components/ControlPanel'
import { PlayerControls } from './components/PlayerControls'
import { useEngineStore } from './store/useEngineStore'

function App() {
  const isAudioUnlocked = useEngineStore(s => s.isAudioUnlocked)

  return (
    <main className="relative w-screen h-screen bg-[#050505] overflow-hidden flex items-center justify-center p-8">
      <MediaProvider />
      
      {/* Liquid Metal Player Container */}
      <div className="relative w-full max-w-5xl aspect-video liquid-metal rounded-xl flex flex-col overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        
        {/* Canvas Area */}
        <div className="flex-1 relative bg-black rounded-t-xl overflow-hidden border-b border-[#222]">
          <Viewport />
        </div>

        {/* Media Controls Bottom Bar */}
        {isAudioUnlocked && <PlayerControls />}
        
        {/* Parameter Panel attached to the right side */}
        {isAudioUnlocked && (
          <div className="absolute top-4 -right-[340px]">
            <ControlPanel />
          </div>
        )}
      </div>

    </main>
  )
}

export default App
