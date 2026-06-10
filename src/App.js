import logo from './logo.svg';
import './App.css';
import RadioPlayer from './RadioPlayer.js'
function App() {
  return (
    <div className="App">
      <header className="App-header">
  <h1>
    Radio Internetowe
  </h1>
</header>
      <main className="main-content">
        <RadioPlayer />
      </main>
      <footer className="footer">
        <p>&copy; 2026 Radio Internetowe. Wszelkie prawa zastrzeżone.</p>
      </footer>
    </div>
  );
}

export default App;
