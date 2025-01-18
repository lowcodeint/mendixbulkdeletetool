
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".menu-bar ul li a");
    const sections = document.querySelectorAll("#content section");
   
  
    tabs.forEach(tab => {
        tab.addEventListener("click", event => {
            event.preventDefault(); // Prevent default link behavior
  
            // Remove 'active-section' class from all sections
            sections.forEach(section => section.classList.add("hidden-section"));
            sections.forEach(section => section.classList.remove("active-section"));
            console.log(tab);
  
            // Add 'active-section' to the target section
            const targetId = tab.getAttribute("href").substring(1); // Remove # from href
            const targetSection = document.getElementById(targetId);
  
            if (targetSection) {
                targetSection.classList.add("active-section");
                targetSection.classList.remove("hidden-section");
            }
  
            // Optionally highlight the active tab
            tabs.forEach(t => t.classList.remove("active-tab"));
            tab.classList.add("active-tab");
        });
    });
  });