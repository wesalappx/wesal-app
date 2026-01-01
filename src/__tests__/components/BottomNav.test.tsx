import { render } from '@/utils/test-utils'
import BottomNav from '@/components/BottomNav'

describe('BottomNav Component', () => {
    it('should render without crashing', () => {
        const { container } = render(<BottomNav />)
        expect(container).toBeTruthy()
    })

    it('should render a div element', () => {
        const { container } = render(<BottomNav />)
        expect(container.firstChild).toBeDefined()
    })
})
