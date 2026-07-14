import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')

  const [showAdmin, setShowAdmin] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [newCar, setNewCar] = useState({ name: '', brand: '', price_per_day: '', image_url: '' })

  const [session, setSession] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authMessage, setAuthMessage] = useState('')

  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [filteredCars, setFilteredCars] = useState([])
  const [searched, setSearched] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchCars()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchCars() {
    const { data, error } = await supabase.from('cars').select('*')
    if (error) {
      console.error('Error fetching cars:', error)
    } else {
      setCars(data)
    }
  }

  function openBookingForm(car) {
    setSelectedCar(car)
    setMessage('')
  }

  function closeBookingForm() {
    setSelectedCar(null)
    setCustomerName('')
    setStartDate('')
    setEndDate('')
  }

  async function handleBookingSubmit(e) {
    e.preventDefault()
    const { error } = await supabase.from('bookings').insert([
      {
        car_id: selectedCar.id,
        customer_name: customerName,
        start_date: startDate,
        end_date: endDate,
        status: 'pending'
      }
    ])
    if (error) {
      console.error('Error creating booking:', error)
      setMessage('Something went wrong. Please try again.')
    } else {
      // Update local state immediately so the UI reflects the change right away
      setCars((prev) =>
        prev.map((c) => (c.id === selectedCar.id ? { ...c, available: false } : c))
      )
      setFilteredCars((prev) =>
        prev.map((c) => (c.id === selectedCar.id ? { ...c, available: false } : c))
      )

      const { error: updateError } = await supabase
        .from('cars')
        .update({ available: false })
        .eq('id', selectedCar.id)
      if (updateError) {
        console.error('Error updating car availability in database:', updateError)
      }

      setMessage('Booking submitted successfully!')
      setTimeout(() => {
        closeBookingForm()
      }, 1500)
    }
  }

  function checkAdminPassword() {
    if (adminPassword === 'admin123') {
      setAdminUnlocked(true)
    } else {
      alert('Wrong password')
    }
  }

  async function handleAddCar(e) {
    e.preventDefault()
    const { error } = await supabase.from('cars').insert([
      {
        name: newCar.name,
        brand: newCar.brand,
        price_per_day: parseFloat(newCar.price_per_day),
        image_url: newCar.image_url,
        available: true
      }
    ])
    if (error) {
      console.error(error)
      alert('Error adding car')
    } else {
      setNewCar({ name: '', brand: '', price_per_day: '', image_url: '' })
      fetchCars()
    }
  }

  async function toggleAvailability(car) {
    const { error } = await supabase
      .from('cars')
      .update({ available: !car.available })
      .eq('id', car.id)
    if (!error) fetchCars()
  }

  async function handleAuthSubmit(e) {
    e.preventDefault()
    setAuthMessage('')

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword
      })
      if (error) {
        setAuthMessage(error.message)
      } else {
        setAuthMessage('Signup successful! You are now logged in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      })
      if (error) {
        setAuthMessage(error.message)
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function handleSearch(e) {
    e.preventDefault()

    const { data: overlappingBookings, error } = await supabase
      .from('bookings')
      .select('car_id')
      .lte('start_date', returnDate)
      .gte('end_date', pickupDate)

    if (error) {
      console.error('Error checking bookings:', error)
      return
    }

    const bookedCarIds = overlappingBookings.map((b) => b.car_id)

    const available = cars.filter(
      (car) => car.available && !bookedCarIds.includes(car.id)
    )

    setFilteredCars(available)
    setSearched(true)
  }

  const baseList = searched ? filteredCars : cars
  const displayedCars = searchText.trim()
    ? baseList.filter(
        (car) =>
          car.name.toLowerCase().includes(searchText.toLowerCase()) ||
          car.brand.toLowerCase().includes(searchText.toLowerCase())
      )
    : baseList

  if (!session) {
    return (
      <div className="login-gate">
        <div className="login-gate-card">
          <div className="logo" style={{ marginBottom: '20px' }}>Drive<span>Rent</span></div>
          <div className="section-title">{authMode === 'login' ? 'Log In' : 'Sign Up'}</div>
          <form onSubmit={handleAuthSubmit}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
            <button className="btn" type="submit" style={{ width: '100%' }}>
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          <p className="switch-text">
            {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
          {authMessage && <p className="form-message">{authMessage}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <div className="logo">Drive<span>Rent</span></div>
        <button className="btn btn-outline btn-small" onClick={() => setShowAdmin(!showAdmin)}>
          {showAdmin ? 'Hide Admin' : 'Admin Panel'}
        </button>
      </div>

      <div className="hero">
        <h1>Find your rental car</h1>
        <p className="hero-sub">Compare available cars and book instantly</p>
        <form className="search-bar" onSubmit={handleSearch}>
          <div>
            <label className="field-label">Pick-up date</label>
            <input
              className="input"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Return date</label>
            <input
              className="input"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit">Search</button>
        </form>

        <div className="text-search-bar">
          <input
            className="input"
            type="text"
            placeholder="Search by car name or brand (e.g. Tesla, Civic)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="top-row">
        <div className="card auth-card">
          <p style={{ margin: '0 0 10px', fontSize: '14px' }}>
            Logged in as <strong>{session.user.email}</strong>
          </p>
          <button className="btn btn-outline btn-small" onClick={handleLogout}>Log Out</button>
        </div>

        {showAdmin && !adminUnlocked && (
          <div className="card admin-card">
            <div className="section-title">Admin Access</div>
            <input
              className="input"
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <button className="btn" style={{ width: '100%' }} onClick={checkAdminPassword}>Unlock</button>
          </div>
        )}

        {showAdmin && adminUnlocked && (
          <div className="card admin-card">
            <div className="section-title">Add New Car</div>
            <form onSubmit={handleAddCar}>
              <input
                className="input"
                placeholder="Name"
                value={newCar.name}
                onChange={(e) => setNewCar({ ...newCar, name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Brand"
                value={newCar.brand}
                onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Price per day"
                type="number"
                value={newCar.price_per_day}
                onChange={(e) => setNewCar({ ...newCar, price_per_day: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Image URL"
                value={newCar.image_url}
                onChange={(e) => setNewCar({ ...newCar, image_url: e.target.value })}
              />
              <button className="btn" style={{ width: '100%' }} type="submit">Add Car</button>
            </form>
          </div>
        )}
      </div>

      <div className="car-list">
        {displayedCars.map((car) => (
          <div key={car.id} className="car-row">
            <img className="car-row-image" src={car.image_url} alt={car.name} />
            <div className="car-row-info">
              <div className="car-row-top">
                <div>
                  <h3 className="car-name">{car.name}</h3>
                  <p className="car-brand">{car.brand}</p>
                  <div className="car-meta">
                    <span>⭐ {car.rating}</span>
                    <span>👤 {car.seats} seats</span>
                    <span>⚙️ {car.transmission}</span>
                  </div>
                </div>
                <span className={`badge ${car.available ? 'badge-available' : 'badge-unavailable'}`}>
                  {car.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="car-row-bottom">
                <p className="car-price">${car.price_per_day} <span>/ day</span></p>
                <div className="car-actions">
                  {car.available && session && (
                    <button className="btn btn-small" onClick={() => openBookingForm(car)}>Book Now</button>
                  )}
                  {adminUnlocked && (
                    <button className="btn btn-outline btn-small" onClick={() => toggleAvailability(car)}>
                      Mark {car.available ? 'Unavailable' : 'Available'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {((searched && filteredCars.length === 0) || (displayedCars.length === 0 && searchText.trim())) && (
        <p style={{ color: '#999', marginTop: '15px' }}>No cars found.</p>
      )}

      {selectedCar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Book {selectedCar.name}</h2>
            <form onSubmit={handleBookingSubmit}>
              <label className="field-label">Your Name</label>
              <input
                className="input"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <label className="field-label">Start Date</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <label className="field-label">End Date</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              {message && <p className="form-message">{message}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="btn" type="submit">Confirm Booking</button>
                <button className="btn btn-outline" type="button" onClick={closeBookingForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App