export namespace ChordParseMessages {
    export const Error_ChordNameUnexpectedText = "无法识别的和弦组成部分：'{0}'";
    export const Error_ChordDim9NotSupported = "不存在dim9和弦，因为其中的减九度相当于纯八度。如果要在dim7的基础上叠加大九度，请使用dim7add9";
    export const Error_ChordDim11NotSupported = "不存在dim11和弦，因为其中的减九度相当于纯八度";
    export const Error_ChordDim13NotSupported = "不存在dim13和弦，因为其中的减九度相当于纯八度";
    export const Error_ChordMissingOrInvalidBassNote = "无法识别的和弦根音";
    export const Error_UnknownAddedTone = "无法识别的添加音";
    export const Warning_AlreadyHaveMinorSecond = "和弦里已经包括了小二度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedSecond = "和弦里已经包括了增二度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveMinorThird = "和弦里已经包括了小三度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedFourth = "和弦里已经包括了增四度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveDiminishedFifth = "和弦里已经包括了减五度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedFifth = "和弦里已经包括了增五度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveMinorSixth = "和弦里已经包括了小六度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedSixth = "和弦里已经包括了增六度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveMinorNinth = "和弦里已经包括了小九度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedNinth = "和弦里已经包括了增九度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedEleventh = "和弦里已经包括了增十一度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveMinorThirteenth = "和弦里已经包括了小十三度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveAugmentedThirteenth = "和弦里已经包括了增十三度音，'{0}'将被忽略";

    export const Error_AlreadyHaveMinorSecond = "和弦里已经包括了小二度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedSecond = "和弦里已经包括了增二度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveMinorThird = "和弦里已经包括了小三度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedFourth = "和弦里已经包括了增四度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveDiminishedFifth = "和弦里已经包括了减五度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedFifth = "和弦里已经包括了增五度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveMinorSixth = "和弦里已经包括了小六度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedSixth = "和弦里已经包括了增六度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveMinorSeventh = "和弦里已经包括了小七度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveMinorNinth = "和弦里已经包括了小九度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedNinth = "和弦里已经包括了增九度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedEleventh = "和弦里已经包括了增十一度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveMinorThirteenth = "和弦里已经包括了小十三度音，无法应用改变音'{0}'";
    export const Error_AlreadyHaveAugmentedThirteenth = "和弦里已经包括了增十三度音，无法应用改变音'{0}'";

    export const Error_UnalterableDegree = "不能应用改变音'{0}'";
    export const Error_AlteringNonExistingSecond = "和弦内没有二度音，不能应用改变音'{0}'";
    export const Error_AlteringNonExistingFourth = "和弦内没有四度音，不能应用改变音'{0}'";
    export const Error_AlteringNonExistingFifth = "和弦内没有五度音，不能应用改变音'{0}'";
    export const Error_AlteringNonExistingSixth = "和弦内没有六度音，不能应用改变音'{0}'";
    export const Error_AlteringNonExistingNinth = "和弦内没有九度音，不能应用改变音'{0}'";
    export const Error_AlteringNonExistingEleventh = "和弦内没有十一度音，不能应用改变音'{0}'";
    export const Error_AlteringNonExistingThirteenth = "和弦内没有十三度音，不能应用改变音'{0}'";

    export const Warning_AlteringSecondWhileHavingNinth = "试图使用'{0}'改变二度音，但和弦内只有九度音。将会自动修正为改变九度音";
    export const Warning_AlteringFourthWhileHavingEleventh = "试图使用'{0}'改变四度音，但和弦内只有十一度音。将会自动修正为改变十一度音";
    export const Warning_AlteringSixthWhileHavingThirteenth = "试图使用'{0}'改变六度音，但和弦内只有十三度音。将会自动修正为改变十三度音";
    export const Warning_AlteringNinthWhileHavingSecond = "试图使用'{0}'改变九度音，但和弦内只有二度音。将会自动修正为改变二度音";
    export const Warning_AlteringEleventhWhileHavingFourth = "试图使用'{0}'改变十一度音，但和弦内只有四度音。将会自动修正为改变四度音";
    export const Warning_AlteringThirteenthWhileHavingSixth = "试图使用'{0}'改变十三度音，但和弦内只有六度音。将会自动修正为改变六度音";

    export const Warning_ChordSuspended2NotAvailable = "不应在此类和弦上使用挂留音，因为三度音被替换后将会消除它的原有属性";
    export const Warning_ChordSuspended4NotAvailable = "不应在此类和弦上使用挂留音，因为三度音被替换后将会消除它的原有属性";
    export const Warning_AlreadyHaveSecondWhileAddingTone = "和弦里已经包含了二度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveFourthWhileAddingTone = "和弦里已经包含了四度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveSixthWhileAddingTone = "和弦里已经包含了六度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveNinthWhileAddingTone = "和弦里已经包含了九度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveEleventhWhileAddingTone = "和弦里已经包含了十一度音，'{0}'将被忽略";
    export const Warning_AlreadyHaveThirteenthWhileAddingTone = "和弦里已经包含了十三度音，'{0}'将被忽略";

    export const Error_ChordAlreadyHaveSecondWhenSuspending = "和弦里已经包含了二度或九度音，不能在此和弦上使用挂二音";
    export const Error_ChordAlreadyHaveFourthWhenSuspending = "和弦里已经包含了四度或十一度音，不能在此和弦上使用挂四音";

    export const Error_AlteringWithFlattenFourth = "减四度音相当于大三度，因此不能降低和弦中的四度音";
    export const Error_AlteringWithFlattenEleventh = "减十一度音相当于大十度（大三度），因此不能降低和弦中的十一度音";

    export const Error_DegreeToAlterExpected = "'{0}'后面应该接上需要改变的度数";
}