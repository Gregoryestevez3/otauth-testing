// Modern 2025 color palette with vibrant accents and rich gradients
const tintColorLight = '#5E6AD2'; // Modern indigo primary
const tintColorDark = '#8D93FF'; // Bright indigo for dark mode

export default {
  light: {
    text: '#1A1D2A',
    secondaryText: '#4A4D5A',
    background: '#F8F9FE',
    tint: tintColorLight,
    tabIconDefault: '#8E92A1',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E8E9F3',
    error: '#F45D5F',
    success: '#41D0A5',
    warning: '#FFB547',
    buttonText: '#FFFFFF',
    gradient: {
      primary: ['#5E6AD2', '#7467CE'],
      secondary: ['#41D0A5', '#49AAF2'],
      success: ['#41D0A5', '#36B99A'],
      error: ['#F45D5F', '#E74645'],
    }
  },
  dark: {
    text: '#E9EBFF',
    secondaryText: '#A9B0C5',
    background: '#0F1221',
    tint: tintColorDark,
    tabIconDefault: '#51556A',
    tabIconSelected: tintColorDark,
    card: '#1A1F36',
    border: '#282D45',
    error: '#F56B6D',
    success: '#3DC99F',
    warning: '#FFB547',
    buttonText: '#FFFFFF',
    gradient: {
      primary: ['#8D93FF', '#7467CE'],
      secondary: ['#3DC99F', '#49AAF2'],
      success: ['#3DC99F', '#32A88B'],
      error: ['#F56B6D', '#E95655'],
    }
  },
};
