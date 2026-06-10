import React, { useState, useRef, useEffect } from 'react';
import './index.css';

const RadioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentStation, setCurrentStation] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  // State dla danych systemowych i geolokalizacji
  const [browserInfo, setBrowserInfo] = useState({
    userAgent: '',
    browserName: '',
    browserEngine: '',
    language: '',
    platform: '',
    cookiesEnabled: false
  });
  const [locationInfo, setLocationInfo] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    error: null,
    loading: false
  });
  
  const audioRef = useRef(null);

  const radioStations = [
    {
      id: 1,
      name: 'Antyradio',
      url: 'https://an.cdn.eurozet.pl/ant-waw.mp3'
    },
    {
      id: 2,
      name: 'Radio ZET',
      url: 'https://zt.cdn.eurozet.pl/zet-tun.mp3'
    },
    {
      id: 3,
      name: 'RMF FM',
      url: 'https://rs102-krk.rmfstream.pl/rmf_fm'
    }
  ];

  // Funkcja do parsowania informacji o przeglądarce z userAgent
  const parseBrowserInfo = (userAgent) => {
    let browserName = "Nieznana";
    let browserEngine = "Nieznany";
    
    // Wykrywanie silnika przeglądarki
    if (userAgent.indexOf('WebKit') !== -1) {
      browserEngine = 'WebKit';
      if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edge') === -1) {
        browserEngine = 'Blink (Chromium)';
      }
    }
    if (userAgent.indexOf('Gecko') !== -1 && userAgent.indexOf('KHTML') === -1) {
      browserEngine = 'Gecko';
    }
    if (userAgent.indexOf('Trident') !== -1) {
      browserEngine = 'Trident';
    }
    if (userAgent.indexOf('Presto') !== -1) {
      browserEngine = 'Presto';
    }
    
    // Wykrywanie nazwy przeglądarki
    if (userAgent.indexOf('Edge') !== -1) {
      browserName = 'Microsoft Edge';
    } else if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1) {
      browserName = 'Google Chrome';
    } else if (userAgent.indexOf('Firefox') !== -1) {
      browserName = 'Mozilla Firefox';
    } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
      browserName = 'Apple Safari';
    } else if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR') !== -1) {
      browserName = 'Opera';
    } else if (userAgent.indexOf('Trident') !== -1) {
      browserName = 'Internet Explorer';
    }
    
    return { browserName, browserEngine };
  };

  // Funkcja do pobierania geolokalizacji
  const getGeolocation = () => {
    setLocationInfo(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setLocationInfo(prev => ({
        ...prev,
        loading: false,
        error: 'Geolokalizacja nie jest wspierana przez Twoją przeglądarkę'
      }));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      // Sukces
      (position) => {
        setLocationInfo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: new Date(position.timestamp),
          error: null,
          loading: false
        });
      },
      // Błąd
      (error) => {
        let errorMessage = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Odmówiono dostępu do lokalizacji. Aby korzystać z tej funkcji, włącz dostęp do lokalizacji w ustawieniach przeglądarki.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informacja o lokalizacji jest niedostępna.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Przekroczono czas oczekiwania na lokalizację.';
            break;
          default:
            errorMessage = 'Wystąpił nieznany błąd podczas pobierania lokalizacji.';
        }
        setLocationInfo(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          latitude: null,
          longitude: null
        }));
      },
      // Opcje
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Pobieranie informacji o przeglądarce przy starcie
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const { browserName, browserEngine } = parseBrowserInfo(userAgent);
    
    setBrowserInfo({
      userAgent: userAgent,
      browserName: browserName,
      browserEngine: browserEngine,
      language: navigator.language || navigator.userLanguage || 'Nieznany',
      platform: navigator.platform || 'Nieznana',
      cookiesEnabled: navigator.cookieEnabled
    });
    
    // Automatyczne pobranie geolokalizacji przy starcie (opcjonalne)
    // getGeolocation();
  }, []);

  // Initialize audio element
  useEffect(() => {
  const audio = new Audio();
  audio.volume = volume;
  audio.preload = 'none';
  
  // Ustaw domyślną stację (Antyradio)
  audio.src = radioStations[0].url;  
    // Error handling
    audio.addEventListener('error', (e) => {
      setError('Nie udało się połączyć ze stacją. Sprawdź połączenie internetowe.');
      setIsPlaying(false);
      setIsLoading(false);
      console.error('Audio error:', e);
    });

    audio.addEventListener('canplay', () => {
      setIsLoading(false);
      setError(null);
    });

    audio.addEventListener('playing', () => {
      setIsLoading(false);
    });

    audioRef.current = audio;

    // Clock update
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(timer);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle station change
  const handleStationChange = (e) => {
    const stationIndex = parseInt(e.target.value);
    setCurrentStation(stationIndex);
    setError(null);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    audioRef.current.src = radioStations[stationIndex].url;
    audioRef.current.load();
  };

  // Play/Pause toggle
  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        setError(null);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Błąd podczas odtwarzania. Sprawdź stację lub połączenie.');
      setIsPlaying(false);
      setIsLoading(false);
      console.error('Play error:', err);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="radio-player">
      <div className="radio-frame">
        <div className="radio-header">
          <h1 className="radio-title">Odtwarzacz Radia</h1>
          <p className="radio-time">{formatTime(currentDateTime)}</p>
        </div>

        <div className="radio-controls">
          <div className="control-group">
            <label htmlFor="station-select" className="control-label">Wybierz stację:</label><br />
            <select
              id="station-select"
              value={currentStation}
              onChange={handleStationChange}
              disabled={isLoading}
              className="station-select"
              aria-label="Wybierz stację radiową"
            >
              {radioStations.map((station, index) => (
                <option key={station.id} value={index}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={togglePlayPause}
            className={`play-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
            aria-label={isPlaying ? 'Zatrzymaj odtwarzanie' : 'Rozpocznij odtwarzanie'}
            disabled={isLoading}
          >
            <span className="button-icon">
              {isLoading ? '⏳' : isPlaying ? '⏸' : '▶'}
            </span>
            <span className="button-text">
              {isLoading ? 'Łączenie...' : isPlaying ? 'Pauza' : 'Odtwórz'}
            </span>
          </button>
        </div>

        <div className="volume-control">
          <label htmlFor="volume-slider" className="volume-label">Głośność:</label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
            aria-label="Regulacja głośności"
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>

        {error && (
          <div className="error-message" role="alert">
            ⚠️ {error}
          </div>
        )}

        <div className="now-playing">
          <p className="now-playing-label">Obecnie słuchasz:</p>
          <p className="now-playing-station">{radioStations[currentStation].name}</p>
          {isPlaying && <p className="playing-indicator">🔴 Na żywo</p>}
        </div>

        {/* Sekcja informacyjna - dane systemowe i geolokalizacja */}
        <div className="info-section">
          <div className="info-header">
            <h3>ℹ️ Informacje systemowe</h3>
          </div>
          
          <div className="browser-info">
            <h4>🌐 Przeglądarka:</h4>
            <p><strong>Nazwa:</strong> {browserInfo.browserName}</p>
            <p><strong>Silnik:</strong> {browserInfo.browserEngine}</p>
            <p><strong>Język systemu:</strong> {browserInfo.language}</p>
            <p><strong>Platforma:</strong> {browserInfo.platform}</p>
            <p><strong>Cookies:</strong> {browserInfo.cookiesEnabled ? '✓ Włączone' : '✗ Wyłączone'}</p>
            <details className="useragent-details">
              <summary>User Agent (szczegóły)</summary>
              <p className="useragent-text">{browserInfo.userAgent}</p>
            </details>
          </div>

          <div className="geolocation-info">
            <div className="geolocation-header">
              <h4>📍 Geolokalizacja</h4>
              <button 
                onClick={getGeolocation} 
                className="location-btn"
                disabled={locationInfo.loading}
              >
                {locationInfo.loading ? 'Pobieranie...' : 'Pobierz lokalizację'}
              </button>
            </div>
            
            {locationInfo.error ? (
              <div className="location-error">
                <span className="error-icon">⚠️</span>
                <p>{locationInfo.error}</p>
                {locationInfo.error.includes('Odmówiono dostępu') && (
                  <p className="error-hint">
                    💡 Wskazówka: Aby włączyć geolokalizację, sprawdź ustawienia prywatności swojej przeglądarki.
                  </p>
                )}
              </div>
            ) : locationInfo.latitude ? (
              <div className="location-success">
                <p><strong>Szerokość:</strong> {locationInfo.latitude.toFixed(6)}°</p>
                <p><strong>Długość:</strong> {locationInfo.longitude.toFixed(6)}°</p>
                <p><strong>Dokładność:</strong> ±{locationInfo.accuracy}m</p>
                <p><strong>Data pobrania:</strong> {formatDate(locationInfo.timestamp)} {locationInfo.timestamp && formatTime(locationInfo.timestamp)}</p>
                <a 
                  href={`https://www.openstreetmap.org/?mlat=${locationInfo.latitude}&mlon=${locationInfo.longitude}#map=15/${locationInfo.latitude}/${locationInfo.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  🗺️ Zobacz na mapie
                </a>
              </div>
            ) : (
              <div className="location-prompt">
                <p>🌍 Kliknij przycisk, aby udostępnić swoją lokalizację.</p>
                <p className="privacy-note">
                  Twoja lokalizacja jest przetwarzana lokalnie i nie jest zapisywana na serwerze.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;