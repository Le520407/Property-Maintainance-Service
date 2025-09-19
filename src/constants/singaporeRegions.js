// Singapore regions, districts, and areas
export const SINGAPORE_REGIONS = [
  // Central Region
  { value: 'Central', label: 'Central Singapore', category: 'region' },
  { value: 'City Hall', label: 'City Hall', category: 'district', region: 'Central' },
  { value: 'Marina Bay', label: 'Marina Bay', category: 'district', region: 'Central' },
  { value: 'Orchard', label: 'Orchard', category: 'district', region: 'Central' },
  { value: 'Raffles Place', label: 'Raffles Place', category: 'district', region: 'Central' },
  { value: 'Tanjong Pagar', label: 'Tanjong Pagar', category: 'district', region: 'Central' },
  { value: 'Chinatown', label: 'Chinatown', category: 'district', region: 'Central' },
  { value: 'Clarke Quay', label: 'Clarke Quay', category: 'district', region: 'Central' },
  
  // North Region
  { value: 'North', label: 'North Singapore', category: 'region' },
  { value: 'Admiralty', label: 'Admiralty', category: 'district', region: 'North' },
  { value: 'Sembawang', label: 'Sembawang', category: 'district', region: 'North' },
  { value: 'Woodlands', label: 'Woodlands', category: 'district', region: 'North' },
  { value: 'Yishun', label: 'Yishun', category: 'district', region: 'North' },
  { value: 'Kranji', label: 'Kranji', category: 'district', region: 'North' },
  { value: 'Marsiling', label: 'Marsiling', category: 'district', region: 'North' },
  
  // Northeast Region
  { value: 'Northeast', label: 'Northeast Singapore', category: 'region' },
  { value: 'Ang Mo Kio', label: 'Ang Mo Kio', category: 'district', region: 'Northeast' },
  { value: 'Hougang', label: 'Hougang', category: 'district', region: 'Northeast' },
  { value: 'Punggol', label: 'Punggol', category: 'district', region: 'Northeast' },
  { value: 'Sengkang', label: 'Sengkang', category: 'district', region: 'Northeast' },
  { value: 'Serangoon', label: 'Serangoon', category: 'district', region: 'Northeast' },
  { value: 'Bishan', label: 'Bishan', category: 'district', region: 'Northeast' },
  
  // East Region
  { value: 'East', label: 'East Singapore', category: 'region' },
  { value: 'Bedok', label: 'Bedok', category: 'district', region: 'East' },
  { value: 'Changi', label: 'Changi', category: 'district', region: 'East' },
  { value: 'Pasir Ris', label: 'Pasir Ris', category: 'district', region: 'East' },
  { value: 'Tampines', label: 'Tampines', category: 'district', region: 'East' },
  { value: 'Simei', label: 'Simei', category: 'district', region: 'East' },
  { value: 'Kembangan', label: 'Kembangan', category: 'district', region: 'East' },
  { value: 'Eunos', label: 'Eunos', category: 'district', region: 'East' },
  { value: 'Paya Lebar', label: 'Paya Lebar', category: 'district', region: 'East' },
  
  // West Region
  { value: 'West', label: 'West Singapore', category: 'region' },
  { value: 'Bukit Batok', label: 'Bukit Batok', category: 'district', region: 'West' },
  { value: 'Bukit Panjang', label: 'Bukit Panjang', category: 'district', region: 'West' },
  { value: 'Choa Chu Kang', label: 'Choa Chu Kang', category: 'district', region: 'West' },
  { value: 'Clementi', label: 'Clementi', category: 'district', region: 'West' },
  { value: 'Jurong East', label: 'Jurong East', category: 'district', region: 'West' },
  { value: 'Jurong West', label: 'Jurong West', category: 'district', region: 'West' },
  { value: 'Pioneer', label: 'Pioneer', category: 'district', region: 'West' },
  { value: 'Tuas', label: 'Tuas', category: 'district', region: 'West' },
  { value: 'Boon Lay', label: 'Boon Lay', category: 'district', region: 'West' },
  
  // Central West Region
  { value: 'Central West', label: 'Central West Singapore', category: 'region' },
  { value: 'Buona Vista', label: 'Buona Vista', category: 'district', region: 'Central West' },
  { value: 'Dover', label: 'Dover', category: 'district', region: 'Central West' },
  { value: 'Commonwealth', label: 'Commonwealth', category: 'district', region: 'Central West' },
  { value: 'Queenstown', label: 'Queenstown', category: 'district', region: 'Central West' },
  { value: 'Tanglin', label: 'Tanglin', category: 'district', region: 'Central West' },
  { value: 'Holland Village', label: 'Holland Village', category: 'district', region: 'Central West' },
  
  // Southeast Region
  { value: 'Southeast', label: 'Southeast Singapore', category: 'region' },
  { value: 'Geylang', label: 'Geylang', category: 'district', region: 'Southeast' },
  { value: 'Kallang', label: 'Kallang', category: 'district', region: 'Southeast' },
  { value: 'Marine Parade', label: 'Marine Parade', category: 'district', region: 'Southeast' },
  { value: 'Katong', label: 'Katong', category: 'district', region: 'Southeast' },
  { value: 'Joo Chiat', label: 'Joo Chiat', category: 'district', region: 'Southeast' },
  
  // Southwest Region
  { value: 'Southwest', label: 'Southwest Singapore', category: 'region' },
  { value: 'Bukit Merah', label: 'Bukit Merah', category: 'district', region: 'Southwest' },
  { value: 'Harbourfront', label: 'Harbourfront', category: 'district', region: 'Southwest' },
  { value: 'Henderson', label: 'Henderson', category: 'district', region: 'Southwest' },
  { value: 'Redhill', label: 'Redhill', category: 'district', region: 'Southwest' },
  { value: 'Tiong Bahru', label: 'Tiong Bahru', category: 'district', region: 'Southwest' }
];

// Extract just the districts for easier use in dropdowns
export const SINGAPORE_DISTRICTS = SINGAPORE_REGIONS
  .filter(region => region.category === 'district')
  .map(district => ({ value: district.value, label: district.label }));

// Extract just the main regions
export const SINGAPORE_MAIN_REGIONS = SINGAPORE_REGIONS
  .filter(region => region.category === 'region')
  .map(region => ({ value: region.value, label: region.label }));

// Popular areas/districts that are commonly used
export const POPULAR_SINGAPORE_AREAS = [
  'Orchard',
  'Marina Bay',
  'Raffles Place',
  'Jurong East',
  'Tampines',
  'Woodlands',
  'Bishan',
  'Ang Mo Kio',
  'Clementi',
  'Bedok',
  'Hougang',
  'Yishun',
  'Punggol',
  'Sengkang',
  'Queenstown',
  'Bukit Merah',
  'Geylang',
  'Kallang',
  'Toa Payoh',
  'Novena'
];

// Singapore postal sectors (first 2 digits of postal code)
export const SINGAPORE_POSTAL_SECTORS = {
  'Central': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'],
  'Northeast': ['53', '54', '55', '56', '57', '82', '53'],
  'East': ['46', '47', '48', '49', '50', '51', '52'],
  'North': ['72', '73', '75', '76', '77'],
  'West': ['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'],
  'Southeast': ['40', '41', '42', '43', '44', '45'],
  'Southwest': ['09', '10', '15', '16', '11', '12', '13']
};

export default SINGAPORE_REGIONS;