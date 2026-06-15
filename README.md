# Asystent AI dla testera oprogramowania

Aplikacja webowa zbudowana w oparciu o framework Flask (Python), zintegrowana z Gemini API poprzez strukturyzowaną komunikację JSON. Projekt realizuje dwa główne zadania z zakresu automatyzacji pracy testera oprogramowania: automatyczny przegląd jakości kodu oraz generowanie jednostkowych skryptów testowych.

---

## Główne funkcjonalności

### Automatyczny Recenzent i Jakość Kodu

Moduł przeprowadza dogłębny audyt dostarczonego kodu źródłowego. Analizuje strukturę pod kątem wykrywania antywzorców projektowych, naruszeń zasad czystego kodu (Clean Code) oraz potencjalnych błędów logiki. Wynik analizy zwracany jest w postaci ustrukturyzowanego raportu z podziałem na kategorie problemów wraz z sugestiami poprawek.

### Generowanie Testów Jednostkowych

Moduł automatycznie generuje skrypty testowe dla dostarczonego kodu. Obsługuje scenariusze wymagające mockowania zewnętrznych zależności, dzięki czemu tworzone testy są izolowane i gotowe do bezpośredniego użycia w środowisku testowym.

---

## Architektura i technologie

### Frontend

- **Tailwind CSS** — projekt interfejsu oparty na układzie Split-Screen (podzielony ekran, pełna szerokość), zapewniający przejrzysty podział przestrzeni roboczej między dwa moduły aplikacji.
- **JavaScript** — komunikacja z backendem realizowana przez Fetch API; dynamiczne renderowanie komponentów wynikowych bez przeładowania strony.

### Backend

- **Python / Flask** — serwer aplikacji obsługujący routing oraz logikę biznesową.
- **Biblioteka `requests`** — komunikacja z Gemini REST API; zapytania i odpowiedzi przesyłane w formacie JSON.

---

## Instrukcja uruchomienia

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/Tomasz-Lesiak/TIJO-P.git
cd TIJO-P
```

### 2. Tworzenie i aktywacja wirtualnego środowiska

```bash
python -m venv venv
```

Aktywacja na systemie **Windows**:

```bash
venv\Scripts\activate
```

Aktywacja na systemie **macOS / Linux**:

```bash
source venv/bin/activate
```

### 3. Instalacja zależności

```bash
pip install -r requirements.txt
```

### 4. Konfiguracja zmiennych środowiskowych

Skopiuj plik `.env.example` do `.env`:

```bash
cp .env.example .env
```

Otwórz plik `.env` i uzupełnij wartość klucza API:

```
GEMINI_API_KEY=twoj_klucz_api
```

Klucz API można uzyskać w panelu Google AI Studio.

### 5. Uruchomienie aplikacji

```bash
python app.py
```

Aplikacja dostępna jest pod adresem: `http://127.0.0.1:5000`