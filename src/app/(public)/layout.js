import Navbar from '@/components/Navbar'

export default function PublicLayout({ children }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  )
}
