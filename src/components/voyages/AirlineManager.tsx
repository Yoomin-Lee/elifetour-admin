import OptionsManager from './OptionsManager'
import { fetchAirlineOptions, addAirlineOption, deleteAirlineOption, updateAirlineOption } from '@/lib/queries/airlineOptions'

export default function AirlineManager({ onClose }: { onClose: () => void }) {
  return (
    <OptionsManager
      title="항공사"
      queryKey="airline-options"
      fetchFn={fetchAirlineOptions}
      addFn={addAirlineOption}
      deleteFn={deleteAirlineOption}
      updateFn={updateAirlineOption}
      onClose={onClose}
    />
  )
}
