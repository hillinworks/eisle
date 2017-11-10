function initializeRadios(selectedInstrument) {
    $(document).ready(function () {
        $("input:radio[name='instrument']").change(function () {
            const radios = $("input:radio[name='instrument']");
            radios.each(function () {
                const label = $(this).next().children(".label");
                if (this.checked) {
                    label.removeClass("basic").addClass("black");
                    const contentDiv = label.parents("div.content");
                    const index = contentDiv.prevAll("div.content").length;
                    const accordion = label.parents(".ui.accordion");
                    accordion.accordion("open", index);
                    accordion.accordion("close others");
                } else {
                    label.removeClass("black").addClass("basic");
                }
            });
        });
        const selectedRadio = $(`input:radio[name='instrument'][value='${selectedInstrument}']`);
        selectedRadio.prop("checked", true);
        selectedRadio.trigger("change");
    });
}