import PoliticalDonorTracker from './components/PoliticalDonorTracker'
import { ServicesProvider } from './contexts/ServicesContext'
import { createDefaultServices } from './services'

// Create service instances once at app level using factory functions
const services = createDefaultServices();

function App() {
  return (
    <ServicesProvider services={services}>
      <PoliticalDonorTracker />
    </ServicesProvider>
  )
}

export default App
