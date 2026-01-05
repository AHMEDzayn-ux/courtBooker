export default function PublicLayout({ children }) {
  return (
    <div>
      {/* Public navigation bar will go here */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Sports Booking</h1>
        </div>
      </nav>
      
      {children}
    </div>
  )
}
