const fs = require('fs');
const path = require('path');

// Función para reemplazar los imports de DatePicker
function replaceImports(content) {
  return content
    .replace(/import DatePicker from "react-datepicker";(\s*)import "react-datepicker\/dist\/react-datepicker.css";/g, 
      'import { SimpleDatePicker } from "@/components/ui/simple-date-picker";');
}

// Función para reemplazar los usos de DatePicker con SimpleDatePicker
function replaceDatePickerUsage(content) {
  return content.replace(
    /<DatePicker\s+([^>]*?)selected=\{([^}]+)\}([^>]*?)onChange=\{([^}]+)\}([^>]*?)\s*\/>/g, 
    (match, beforeSelected, selectedValue, betweenProps, onChangeValue, afterProps) => {
      // Extraer cualquier otra prop que necesitamos preservar
      const className = afterProps.match(/className="([^"]+)"/);
      const placeholder = afterProps.match(/placeholderText="([^"]+)"/);
      
      let result = `<SimpleDatePicker\n  date={${selectedValue}}\n  onChange={${onChangeValue}}`;
      
      if (className) {
        result += `\n  className="${className[1]}"`;
      }
      
      if (placeholder) {
        result += `\n  placeholder="${placeholder[1]}"`;
      }
      
      result += "\n/>";
      return result;
    }
  );
}

// Lista de archivos a procesar
const filesToProcess = [
  '/root/mva-admin/components/sections/crearServicioGenericoComponen.tsx',
  '/root/mva-admin/components/sections/capacitacionesCrearComponent.tsx',
  '/root/mva-admin/components/sections/instalacionCrearComponent.tsx'
];

// Procesar cada archivo
filesToProcess.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      let updatedContent = replaceImports(content);
      updatedContent = replaceDatePickerUsage(updatedContent);
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Processed: ${filePath}`);
    } else {
      console.error(`File does not exist: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('All files processed!');
