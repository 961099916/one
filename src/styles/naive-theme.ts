import { GlobalThemeOverrides, darkTheme } from 'naive-ui'

/**
 * Arco Tech Premium Theme Overrides for Naive UI
 * Inspired by ByteDance Arco Design
 */
export const arcoTechThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#165dff',
    primaryColorHover: '#4080ff',
    primaryColorPressed: '#0e42d2',
    primaryColorSuppl: '#165dff',
    
    bodyColor: '#17171a',
    cardColor: '#232324',
    modalColor: '#232324',
    popoverColor: '#232324',
    
    textColorBase: '#f5f5f5',
    textColor1: '#f5f5f5',
    textColor2: '#86909c',
    textColor3: '#4e5969',
    
    borderColor: '#313133',
    dividerColor: '#313133',
    
    borderRadius: '4px', // 更硬朗的大厂风格
  },
  Button: {
    borderRadius: '4px',
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    colorHoverPrimary: '#4080ff',
    colorPressedPrimary: '#0e42d2',
  },
  Card: {
    borderRadius: '6px',
    color: '#232324',
    borderColor: '#313133',
    titleTextColor: '#f5f5f5',
    titleFontWeight: '600',
  },
  Menu: {
    itemColorActive: 'rgba(22, 93, 255, 0.1)',
    itemColorActiveHover: 'rgba(22, 93, 255, 0.15)',
    itemTextColorActive: '#165dff',
    itemTextColorActiveHover: '#165dff',
    itemIconColorActive: '#165dff',
    itemIconColorActiveHover: '#165dff',
    fontSize: '14px',
  },
  Input: {
    color: '#2a2a2b',
    colorFocus: '#2a2a2b',
    border: '1px solid #313133',
    borderFocus: '1px solid #165dff',
    boxShadowFocus: '0 0 0 2px rgba(22, 93, 255, 0.1)',
    placeholderColor: '#4e5969',
    borderRadius: '4px',
  },
  DataTable: {
    thColor: '#2a2a2b',
    tdColor: '#232324',
    tdColorHover: '#2e2e30',
    borderColor: '#313133',
    thTextColor: '#86909c',
    thFontWeight: '600',
  },
  Drawer: {
    color: '#17171a',
  },
  Tag: {
    borderRadius: '2px',
  }
}

/**
 * Light mode Blue Overrides
 */
export const lightArcoThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#165dff',
    primaryColorHover: '#4080ff',
    primaryColorPressed: '#0e42d2',
    primaryColorSuppl: '#165dff',
    borderRadius: '4px',
  }
}

export { darkTheme }
