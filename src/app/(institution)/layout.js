export default function InstitutionLayout({ children }) {
  return (
    <div>
      {/* Institution auth pages layout */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Institution Portal</h1>
        </div>
      </nav>
      
      {children}
    </div>
  )
}
