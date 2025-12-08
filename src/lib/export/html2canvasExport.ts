import html2canvas from 'html2canvas';

/**
 * Centralized html2canvas export helper.
 * Uses the same options as the PDF export to ensure consistency.
 */
export async function captureElementToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    logging: false,
    removeContainer: false,
    onclone: (clonedDoc) => {
      // Set white background on the cloned element for better PDF visibility
      const clonedElement = clonedDoc.body.querySelector('[data-export-container]') as HTMLElement;
      if (clonedElement) {
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.background = '#ffffff';
        clonedElement.style.opacity = '1';
        clonedElement.style.filter = 'none';
        // Also update any child chart containers
        const chartContainers = clonedElement.querySelectorAll('.chart-container, .chart-wrapper, .recharts-wrapper, .recharts-surface');
        chartContainers.forEach((container: Element) => {
          const el = container as HTMLElement;
          el.style.backgroundColor = '#ffffff';
          el.style.background = '#ffffff';
          el.style.opacity = '1';
          el.style.filter = 'none';
        });
        
        // Remove ALL opacity and transparency from ALL elements - CRITICAL for PDF visibility
        const allElements = clonedElement.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          // Force opacity to 1 via inline style (highest priority)
          htmlEl.style.setProperty('opacity', '1', 'important');
          htmlEl.style.setProperty('filter', 'none', 'important');
          htmlEl.style.setProperty('backdrop-filter', 'none', 'important');
          
          // Also set opacity attribute if it's an SVG element
          if (el instanceof SVGElement) {
            el.setAttribute('opacity', '1');
          }
          
          // Fix any rgba backgrounds
          const bgColor = htmlEl.style.backgroundColor;
          if (bgColor && bgColor.includes('rgba')) {
            htmlEl.style.setProperty('background-color', '#ffffff', 'important');
          }
        });
      }
    },
  });
}

