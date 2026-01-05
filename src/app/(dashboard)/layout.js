export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard navigation will go here */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Institution Dashboard</h1>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
