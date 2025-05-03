<script>
  // Wait for the DOM to load
  document.addEventListener("DOMContentLoaded", function () {
    // Get all buttons with the data-target attribute
    const buttons = document.querySelectorAll("button[data-target]");
    
    // Add click event listeners to each button
    buttons.forEach(button => {
      button.addEventListener("click", function () {
        // Get the target page ID from the button's data-target attribute
        const targetId = button.getAttribute("data-target");
        
        // Hide all pages
        document.querySelectorAll(".page").forEach(page => {
          page.style.display = "none";
        });
        
        // Show the target page
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
          targetPage.style.display = "block";
        }
      });
    });
  });
</script>