import OptionsManager from './OptionsManager'
import { fetchRegionOptions, addRegionOption, deleteRegionOption, updateRegionOption } from '@/lib/queries/regionOptions'

export default function RegionManager({ onClose }: { onClose: () => void }) {
  return (
    <OptionsManager
      title="지역/상품명"
      queryKey="region-options"
      fetchFn={fetchRegionOptions}
      addFn={addRegionOption}
      deleteFn={deleteRegionOption}
      updateFn={updateRegionOption}
      onClose={onClose}
    />
  )
}
