# Enhanced Host Navigator for Zabbix

![image](https://github.com/user-attachments/assets/cc808603-48a4-4df6-8e82-c0db880ddfcd)


## Overview

This module is an enhanced version of the native Zabbix "Host Navigator" widget. It transforms the standard widget into a more user-friendly and accessible dropdown filter that appears in the dashboard header, providing a seamless way to select and filter hosts across the entire dashboard.

## Problem Solved

The standard Zabbix Host Navigator widget has several limitations:
- It occupies valuable dashboard space
- It's confined to its widget boundaries
- It lacks search/filter capabilities
- It has limited compatibility with dark/blue themes
- It requires multiple clicks to change hosts

Our enhanced version addresses these issues by:
- Moving the host selection to the dashboard header (near breadcrumbs)
- Freeing up dashboard space for other widgets
- Adding search/type-to-filter functionality
- Ensuring proper visibility in all Zabbix themes
- Providing immediate access to host selection

## Key Features

- **Space-saving design**: Hides the original widget and moves functionality to the header
- **Searchable dropdown**: Type to search for hosts instead of scrolling through a long list
- **Theme compatibility**: Works properly with all Zabbix themes (Default, Dark, Blue)
- **Easy access**: Available throughout the dashboard regardless of scrolling position
- **Widget control**: Retains ability to configure the widget through an edit button

## How It Works

The module extends the native Zabbix host navigator widget through these key components:

1. **CustomWidgetHostNavigator**: Extends the native CWidget class to position the host dropdown in the dashboard header

2. **Enhanced Dropdown**: Replaces the standard select element with a searchable input that:
   - Displays all hosts when focused
   - Allows typing to filter hosts
   - Properly handles keyboard navigation
   - Shows dropdown list above other dashboard elements

3. **Visual Improvements**:
   - Theme-aware styling for dark and blue themes
   - Custom dropdown styling for better visibility
   - Proper positioning of dropdown options

## Installation

1. Copy the module files to `/usr/share/zabbix/modules/hostvariable/`
2. Ensure proper permissions are set
3. Add the Host Navigator widget to your dashboard
4. The module will automatically transform it to use the enhanced version

## Usage

- Add the Host Navigator widget to your dashboard
- The widget will automatically be hidden and its functionality moved to the breadcrumb area
- Click on the host dropdown to see and select hosts
- Type in the dropdown to filter the host list
- Use the edit button (pencil icon) to access widget configuration

## Compatibility

- Tested with Zabbix 7.0
- Compatible with all standard Zabbix themes (Default, Dark, Blue)
- Works with standard dashboard features

## Credits

This module is built upon the native Zabbix Host Navigator widget, enhancing its functionality while maintaining compatibility with the core Zabbix features.

## License

This module is distributed under the GNU Affero General Public License v3.0, the same license as the Zabbix software. 
